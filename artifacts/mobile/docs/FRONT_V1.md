# SamaStock Front V1

Statut: V1 locale officialisée
Version app: 1.0.0
Persistance actuelle: SQLite local via expo-sqlite

## Objectif V1

Cette version valide le front mobile local-first de SamaStock avant l'ajout de Supabase. Elle doit rester utilisable sans backend pour un boutiquier: produits, stock, ventes, reçus, inventaire et dettes fonctionnent sur le téléphone.

## Fonctionnalités incluses

- Onboarding profil boutique local.
- Tableau de bord avec ventes du jour, bénéfice estimé, stock faible et dettes ouvertes.
- Produits SQLite: ajout, recherche, filtres, fiche détail, archivage, stock.
- Scan code-barres: produit connu ou ajout prérempli.
- Inventaire rapide: correction du stock réel avec mouvement d'ajustement.
- Vente rapide cash: panier, contrôle stock, décrémentation transactionnelle.
- Vente à crédit: création vente, décrémentation stock, dette client liée.
- Historique des ventes.
- Reçu détaillé: texte copiable, PDF partageable/imprimable, badge cash/crédit.
- Dettes clients SQLite: ajout manuel, remboursements, fiche client.
- Mouvements de stock: initial, achat, vente, ajustement, archivage.

## Source de vérité

SQLite est la seule source de vérité métier pour la V1:

- `shop_profile`
- `products`
- `sales`
- `sale_items`
- `stock_movements`
- `clients`
- `debts`
- `debt_payments`

L'ancien `StoreContext` métier basé sur AsyncStorage a été retiré.

## Préparation Supabase

La prochaine phase consiste à ajouter Supabase sans casser la V1 locale:

1. Créer le schéma Supabase équivalent aux tables SQLite.
2. Ajouter des colonnes de synchronisation: `remote_id`, `sync_status`, `last_synced_at`, `deleted_at`.
3. Garder SQLite comme cache local et mode hors ligne.
4. Créer une couche service `sync` séparée des repositories SQLite.
5. Synchroniser d'abord les données simples: profil boutique, clients, produits.
6. Synchroniser ensuite les opérations métier: ventes, lignes de vente, mouvements stock, dettes, paiements.
7. Ajouter Supabase Auth seulement après stabilisation de la sync.

## Règle de migration

Ne pas remplacer directement SQLite par Supabase. Supabase doit devenir la couche cloud, tandis que SQLite reste la base locale de travail pour que l'app continue à fonctionner sans connexion.
