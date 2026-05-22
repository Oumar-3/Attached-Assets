# Plan Supabase pour SamaStock

Objectif: ajouter Supabase comme couche cloud sans perdre le mode offline SQLite.

## Principe

SQLite reste la base de travail de l'application mobile. Supabase sert à:

- sauvegarder les données dans le cloud;
- restaurer une boutique sur un autre téléphone;
- préparer le multi-appareil;
- préparer plus tard un dashboard web/admin.

## Étape 1: Schéma cloud

Le fichier `supabase/schema_v1.sql` crée les tables cloud équivalentes aux tables SQLite:

- `shop_profiles`
- `products`
- `clients`
- `sales`
- `sale_items`
- `stock_movements`
- `debts`
- `debt_payments`

Chaque table Supabase contient:

- `id`: identifiant local conservé pour faciliter la sync;
- `owner_id`: utilisateur Supabase Auth propriétaire;
- `sync_status`;
- `created_at`;
- `updated_at`;
- `deleted_at`.

## Étape 2: Métadonnées locales

La migration SQLite V2 ajoute aux tables locales:

- `remote_id`
- `sync_status`
- `last_synced_at`
- `deleted_at`

Ces colonnes permettent de savoir quoi envoyer à Supabase.

## Étape 3: Ordre de synchronisation

Push local vers Supabase:

1. `shop_profile`
2. `clients`
3. `products`
4. `sales`
5. `sale_items`
6. `stock_movements`
7. `debts`
8. `debt_payments`

Le premier moteur disponible est `services/sync/basicSync.ts`.

Il expose:

- `pushBasicTablesAsync()`: envoie `shop_profile`, `clients`, `products` vers Supabase;
- `pullBasicTablesAsync()`: récupère ces mêmes tables depuis Supabase;
- `syncBasicTablesAsync()`: push puis pull.

Précondition: un utilisateur Supabase doit être connecté. Tant que Supabase Auth n'est pas branché dans l'interface, ces fonctions sont prêtes mais ne doivent pas être déclenchées automatiquement.

Pull Supabase vers local:

1. `shop_profiles`
2. `clients`
3. `products`
4. `sales`
5. `sale_items`
6. `stock_movements`
7. `debts`
8. `debt_payments`

## Étape 4: Règles de conflit V1

Pour la V1 Supabase, rester simple:

- Si une ligne locale est `pending`, elle gagne au prochain push.
- Si Supabase a une version plus récente et la ligne locale est `synced`, Supabase gagne au pull.
- Si les deux côtés ont changé, marquer `conflict` et ne pas écraser automatiquement.

Pour les ventes, mouvements de stock, dettes et paiements, privilégier l'append-only: on ajoute des écritures au lieu de modifier l'historique.

## Étape 5: Auth

Supabase Auth arrive après le schéma et le client:

1. Installer `@supabase/supabase-js`.
2. Créer `services/supabase/client.ts`.
3. Configurer `.env` depuis `.env.example`.
4. Remplacer progressivement `AuthContext`.
4. Associer chaque donnée cloud à `auth.uid()`.

Variables requises:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Étape 6: Stockage images

Les images produits doivent rester locales en V1. Ensuite:

1. copier durablement l'image dans le stockage app;
2. envoyer l'image vers Supabase Storage;
3. stocker l'URL publique ou signée dans `products.image_uri`;
4. garder le chemin local pour l'offline.
