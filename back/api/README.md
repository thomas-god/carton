# Description de l'interface avec la base de données Carton

> DISCLAIMER, API en cours de développement : les points d'entrée peuvent changer sans préavis et le contenu de la base de donnée peut être réinitialisé à tout moment.

## Description d'un objet carton

```javascript
{
  user: String,
  _id: ObjectId, // Rempli par la base de données à l'insertion
  parent: ObjectId,
  nom: String,
  private: { type: Boolean, default: false },
  versions: [
    {
      nom: String,
      quoi_texte: "",
      quoi_cartons: [ObjectId],
      fonction_texte: "",
      fonction_cartons: [ObjectId],
      comment_texte: "",
      comment_cartons: [ObjectId],
      exemples_texte: "",
      exemples_cartons: [ObjectId],
      plus_loin_cartons: [ObjectId],
    },
  ]
}
```

## Récupérer tous les cartons originels dans la base

Un Carton originel est un carton sans carton parent.

`GET: /cartons/list`

## Récupérer un carton en particulier

`POST: /cartons/get`

Avec un body `application/json {id, sous_cartons: Bool}`. L'option `sous_cartons` permet de retourner les sous-cartons en tant qu'objets, sinon c'est les ids qui sont retournés.

## Ajouter un nouveau carton

`POST: /cartons/add`

Avec un body `application/json {carton}`

## Modifier un carton existant

`POST: /cartons/update`

Avec un body `application/json {id, update: {name: 'Nouveau nom', ...}}`

## Réinitialiser la base

- Route : `DELETE /cartons/reset`
- Body : `application/json {mdp: RESET_KEY}`
- Response : 205 en cas de succès.