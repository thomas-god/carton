const express = require("express");
const router = express.Router();
const Carton = require("../Carton.model");
const { populate } = require("../plugins/populate.js");

// Récupère la liste de tous les cartons (et sous-cartons)
router.get("/list", async (req, res) => {
  const cartons = await Carton.find();
  res.json(cartons.filter((carton) => !carton.parent));
});

// Récupère un carton par son _id.
// req.body.sous_carton (bool) contrôle si
// on renvoie également les sous cartons.
router.post("/get", async (req, res) => {
  const carton = await Carton.findById(req.body.id);
  if (carton) {
    if (!req.body.sous_carton) {
      res.json(carton);
    } else {
      Object.assign(carton, await populateVersions(carton));
      res.json(carton);
    }
  } else {
    res.status(404).end();
  }
});

// For every version of the carton, populate the types
// ["comment", "quoi", "fonction", "exemples"] with the
// corresponding sub-cartons.
async function populateVersions(carton) {
  for (let v of carton.versions) {
    for (let type of ["comment", "quoi", "fonction", "exemples"]) {
      Object.assign(
        v[type].sous_cartons,
        await getSubCartons(v[type].sous_cartons)
      );
    }
  }
  return carton;
}

// Return a list of carton objects from a list of sub-carton
// objects {carton_id, version_id}
async function getSubCartons(list) {
  let cartons = [];
  for (let carton of list) {
    let res = await Carton.findById(carton.carton_id).lean();
    let categories = {};
    if (res.versions[carton.version_id]) {
      categories = res.versions[carton.version_id];
    } else {
      let id_default = res.versions.find((ver) => ver.nom === "default");
      categories = res.versions[id_default];
    }
    delete categories.nom;
    delete categories._id;
    delete res.versions;
    cartons.push({ ...res, ...categories });
  }
  return cartons;
}

// Ajoute un nouveau carton
router.post("/add", async (req, res) => {
  const carton = new Carton(req.body);
  await carton.save().then((doc) => {
    res.json({ id: doc._id });
  });
});

// Met à jour un carton existant
router.post("/update", async (req, res) => {
  try {
    const operations = ["push", "set"];
    await Promise.all(
      req.body.updates.map((update) => {
        if (operations.includes(update.operation)) {
          return Carton.findByIdAndUpdate(req.body.id, {
            [`$${update.operation}`]: {
              [update.path]: update.value,
            },
          });
        } else {
          return Promise.resolve();
        }
      })
    );
  } catch (error) {
    res.status(400).send(error);
  } finally {
    res.end();
  }
});

// Met à jour le texte d'une catégorie d'un carton existant
router.post("/update/text", (req, res) => {
  let path = `versions.${req.body.version}.${req.body.cat}.texte`;
  Carton.findByIdAndUpdate(
    req.body.id,
    {
      $set: { [path]: req.body.txt },
    },
    (err, doc) => {
      if (err) {
        res.status(400).end();
      } else {
        res.end();
      }
    }
  );
});

// Ajout un sous-carton à la liste des sous cartons d'un carton
router.post("/update/sous_cartons", (req, res) => {
  let path = `versions.${req.body.version}.${req.body.cat}.sous_cartons`;
  Carton.findByIdAndUpdate(
    req.body.id,
    {
      $push: { [path]: req.body.carton },
    },
    (err, doc) => {
      if (err) {
        res.status(400).end();
      } else {
        res.end();
      }
    }
  );
});

// Si on est dans l'alpha, la route supprime les cartons existants
// et insère des dummy cartons dans la base vide.
if (process.env.ALPHA === "true") {
  router.post("/reset", async (req, res) => {
    if (req.body.mdp === process.env.RESET_KEY) {
      await Carton.deleteMany();
      await populate();
      res.status(205).end();
    } else {
      res.status(404).end();
    }
  });
}

module.exports = router;
