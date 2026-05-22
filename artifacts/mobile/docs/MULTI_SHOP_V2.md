# SamaStock multi-boutique V2

Objectif: passer de `un compte = une boutique` a une architecture professionnelle:

```txt
auth.users -> shop_members -> shops -> donnees metier
```

## Ce qui est ajoute

- `supabase/schema_v2_multi_shop.sql`
  - table `shops`;
  - table `shop_members`;
  - colonne `shop_id` sur les tables metier;
  - policies RLS basees sur l'appartenance a une boutique;
  - compatibilite avec `owner_id` pendant la transition.

- Migration SQLite V3
  - table locale `shops`;
  - colonne locale `shop_id` sur les tables metier;
  - creation automatique d'une boutique active locale.

- Sync V2
  - synchronise `shops` avant `shop_profile`;
  - rattache `shop_profile` a `shop_id`;
  - garde les anciens champs `owner_id` pour eviter de casser la V1.

## Ordre de migration conseille

1. Lancer `schema_v1.sql` si ce n'est pas deja fait.
2. Lancer `schema_v2_multi_shop.sql` dans Supabase SQL Editor.
3. Relancer l'app pour appliquer SQLite migration V3.
4. Tester: creer compte, creer boutique, sync, deconnexion, reconnexion.

## Prochaine etape

Les repositories locaux doivent progressivement filtrer les donnees avec la boutique active:

- produits par `shop_id`;
- clients par `shop_id`;
- ventes par `shop_id`;
- dettes par `shop_id`;
- historique par `shop_id`.

Pour la V2 initiale, l'app garde une seule boutique active afin de ne pas casser l'UX existante.
