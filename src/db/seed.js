import db from './db';

const uid = () => crypto.randomUUID();

export async function seedDatabase() {
    const count = await db.categories.count();
    // if (count > 0) return; // Allow running to update images

    if (count === 0) {
        // ===== DEFAULT ADMIN USER =====
        await db.users.bulkAdd([
            { id: uid(), name: 'Admin', pin: '1234', role: 'admin', active: true },
            { id: uid(), name: 'Serveur 1', pin: '1111', role: 'waiter', active: true },
            { id: uid(), name: 'Caissier 1', pin: '2222', role: 'cashier', active: true },
            { id: uid(), name: 'Cuisine', pin: '3333', role: 'kitchen', active: true },
        ]);

        // ===== TABLES (24 Salle + 26 Terrasse = 50) =====
        const tables = [];
        for (let i = 1; i <= 24; i++) {
            tables.push({
                id: uid(),
                name: `Salle ${i}`,
                status: 'free',
                seats: 4,
                zone: 'salle'
            });
        }
        for (let i = 1; i <= 26; i++) {
            tables.push({
                id: uid(),
                name: `Terrasse ${i}`,
                status: 'free',
                seats: 4,
                zone: 'terrasse'
            });
        }
        await db.diningTables.bulkAdd(tables);

        // ===== CATEGORIES & MENU ITEMS =====
        const cats = [
            { id: 'cat-breakfast', name: 'Petit Déjeuner', nameAr: 'فطور', iconKey: 'breakfast', sortOrder: 1 },
            { id: 'cat-salads', name: 'Salades', nameAr: 'سلطات', iconKey: 'salad', sortOrder: 2 },
            { id: 'cat-moroccan', name: 'Marocaine', nameAr: 'أطباق مغربية', iconKey: 'tagine', sortOrder: 3 },
            { id: 'cat-pizza', name: 'Pizza', nameAr: 'بيتزا', iconKey: 'pizza', sortOrder: 4 },
            { id: 'cat-pasta', name: 'Pâtes', nameAr: 'معجنات', iconKey: 'pasta', sortOrder: 5 },
            { id: 'cat-mains', name: 'Plats', nameAr: 'أطباق رئيسية', iconKey: 'steak', sortOrder: 6 },
            { id: 'cat-ofandue', name: 'Ôfandue', nameAr: 'أوفوندو', iconKey: 'wrap', sortOrder: 7 },
            { id: 'cat-sandwich', name: 'Sandwichs', nameAr: 'سندويشات', iconKey: 'sandwich', sortOrder: 8 },
            { id: 'cat-juices', name: 'Jus & Smoothies', nameAr: 'عصائر', iconKey: 'juice', sortOrder: 9 },
            { id: 'cat-drinks', name: 'Boissons', nameAr: 'مشروبات', iconKey: 'coffee', sortOrder: 10 },
            { id: 'cat-desserts', name: 'Desserts', nameAr: 'تحليات', iconKey: 'dessert', sortOrder: 11 },
        ];
        await db.categories.bulkAdd(cats);
    }

    const items = [
        // ===== BREAKFAST =====
        { id: uid(), categoryId: 'cat-breakfast', name: 'Baldi', nameAr: 'بلدي', price: 30, description: 'Msemen, Harcha, mini batbota, Miel, Huile, amlou, olives. Boisson chaude, jus d\'orange.', available: true, stockQty: 999, image: '/menu/petit_dej_traditionnel.jpg' },
        { id: uid(), categoryId: 'cat-breakfast', name: 'Ftourii', nameAr: 'فطوري', price: 30, description: 'Pain grillé, viennoiseries, Beurre, Confiture, Fromage. Boisson chaude, jus d\'orange.', available: true, stockQty: 999, image: '/menu/petit_dej_croissant.jpg' },
        { id: uid(), categoryId: 'cat-breakfast', name: 'Fasi', nameAr: 'فاسي', price: 35, description: 'Batbota, Oeuf au khlii, Olives, huile. Boisson chaude, jus d\'orange.', available: true, stockQty: 999, image: '/menu/petit dej fasi.jpg' },
        { id: uid(), categoryId: 'cat-breakfast', name: 'Master Class', nameAr: 'ماستر كلاس', price: 40, description: 'Omelette au Khlii, Fromage, beurre, Miel, Amlou, confiture. Batbota, Msemen, viennoiseries, Raib.', available: true, stockQty: 999, image: '/menu/petit_dej_traditionnel.jpg' },
        { id: uid(), categoryId: 'cat-breakfast', name: 'Enfants Ftour', nameAr: 'فطور أطفال', price: 25, description: 'Pain grillé, fromage, Jambo ou omelette. Salade, tomate, jus d\'orange.', available: true, stockQty: 999, image: '/menu/petit_dej_croissant.jpg' },
        { id: uid(), categoryId: 'cat-breakfast', name: 'Omini Ftour', nameAr: 'أوميني فطور', price: 25, description: 'Omelette nature, fromage. Salade, tomate, Concombre. Jus d\'orange.', available: true, stockQty: 999, image: '/menu/petit_dej_healthy.jpg' },
        { id: uid(), categoryId: 'cat-breakfast', name: 'Mkilats Nature', nameAr: 'مقيلات طبيعية', price: 10, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-breakfast', name: 'Mkilats Tomate', nameAr: 'مقيلات طماطم', price: 12, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-breakfast', name: 'Mkilats Fromage', nameAr: 'مقيلات جبن', price: 12, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-breakfast', name: 'Mkilats Jambo', nameAr: 'مقيلات جامبون', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-breakfast', name: 'Mkilats Khlii', nameAr: 'مقيلات خليع', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-breakfast', name: 'Extra Petit Déj', nameAr: 'إضافات فطور', price: 5, description: 'Batbot, msamen, huile, olive, beurre, miel, fromage, amlou...', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=500&q=60' },

        // ===== SALADS =====
        { id: uid(), categoryId: 'cat-salads', name: 'Salade Composée S', price: 30, description: 'Small — Base + topping + supplement + extra + sauce', available: true, stockQty: 999, image: '/menu/salade.jpg' },
        { id: uid(), categoryId: 'cat-salads', name: 'Salade Composée M', price: 40, description: 'Medium', available: true, stockQty: 999, image: '/menu/salade.jpg' },
        { id: uid(), categoryId: 'cat-salads', name: 'Salade Composée L', price: 50, description: 'Large', available: true, stockQty: 999, image: '/menu/salade.jpg' },
        { id: uid(), categoryId: 'cat-salads', name: 'Marocaine', price: 15, description: 'Tomate, oignons, poivrons, sauce vinaigrette', available: true, stockQty: 999, image: '/menu/salade_marocaine.jpg' },
        { id: uid(), categoryId: 'cat-salads', name: 'Niçoise', price: 25, description: 'Riz, oeuf, thon, pomme de terre, haricots vert, Betrave, cerise', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-salads', name: 'César', price: 30, description: 'Laitue, tomate cerise, poulet, Croûtons, parmesan, oeuf', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-salads', name: 'Pêcheur', price: 40, description: 'Laitue, avocat, crevette, Calamar, surimi, cerise', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=60' },

        // ===== MOROCCAN =====
        { id: uid(), categoryId: 'cat-moroccan', name: 'Couscous Poulet', price: 20, description: '', available: true, stockQty: 999, image: '/menu/couscous.jpg' },
        { id: uid(), categoryId: 'cat-moroccan', name: 'Couscous Boeuf', price: 25, description: '', available: true, stockQty: 999, image: '/menu/couscous.jpg' },
        { id: uid(), categoryId: 'cat-moroccan', name: 'Couscous Royal', price: 40, description: '', available: true, stockQty: 999, image: '/menu/couscous.jpg' },
        { id: uid(), categoryId: 'cat-moroccan', name: 'Tajine Poulet Citron', price: 35, description: '', available: true, stockQty: 999, image: '/menu/tajine_poulet_citron.jpg' },
        { id: uid(), categoryId: 'cat-moroccan', name: 'Tajine Boeuf Fruits', price: 45, description: '', available: true, stockQty: 999, image: '/menu/tajine_boeuf.jpg' },
        { id: uid(), categoryId: 'cat-moroccan', name: 'Tajine Kefta Oeufs', price: 25, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-moroccan', name: 'Harira', price: 20, description: 'Accompagnons: Oeuf, Date, Chabakia', available: true, stockQty: 999, image: '/menu/harira.jpg' },
        { id: uid(), categoryId: 'cat-moroccan', name: 'Pastilla Poulet', price: 30, description: '', available: true, stockQty: 999, image: '/menu/pastilla.jpg' },
        { id: uid(), categoryId: 'cat-moroccan', name: 'Pastilla Fruit de Mer', price: 40, description: '', available: true, stockQty: 999, image: '/menu/pastilla.jpg' },
        { id: uid(), categoryId: 'cat-moroccan', name: 'Tanjia (1 pers)', price: 30, description: '', available: true, stockQty: 999, image: '/menu/tajine_boeuf.jpg' },
        { id: uid(), categoryId: 'cat-moroccan', name: 'Tanjia (2 pers)', price: 60, description: '', available: true, stockQty: 999, image: '/menu/tajine_boeuf.jpg' },
        { id: uid(), categoryId: 'cat-moroccan', name: 'Nems Poulet', price: 30, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1548559239-5a8286f0144f?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-moroccan', name: 'Nems Viande Hachée', price: 35, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1548559239-5a8286f0144f?auto=format&fit=crop&w=500&q=60' },

        // ===== PIZZA =====
        // ===== PIZZA =====
        { id: uid(), categoryId: 'cat-pizza', name: 'Margarita', nameAr: 'مارغريتا', price: 25, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-pizza', name: 'Végétarien', nameAr: 'نباتية', price: 30, description: '', available: true, stockQty: 999, image: '/menu/pizza_vegetarienne.jpg' },
        { id: uid(), categoryId: 'cat-pizza', name: 'Thon', nameAr: 'تونة', price: 30, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-pizza', name: 'Poulet', nameAr: 'دجاج', price: 40, description: '', available: true, stockQty: 999, image: '/menu/pizza poulet.jpg' },
        { id: uid(), categoryId: 'cat-pizza', name: 'Viande Hachée', nameAr: 'لحم مفروم', price: 40, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-pizza', name: 'Quatre Saisons', nameAr: 'أربعة فصول', price: 45, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-pizza', name: 'Quatre Fromage', nameAr: 'أربعة أجبان', price: 45, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-pizza', name: 'Fruits de Mer', nameAr: 'فواكه البحر', price: 45, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-pizza', name: 'Pizza Master Class', nameAr: 'ماستر كلاس', price: 60, description: 'Poulet, viande, jombo, crevette, calamar, champignons, basilic', available: true, stockQty: 999, image: '/menu/pizza poulet.jpg' },

        // ===== PASTA =====
        { id: uid(), categoryId: 'cat-pasta', name: 'Napolitaine', price: 25, description: 'Sauce Tomate, basilic, cerise, Olive noir', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-pasta', name: 'Bolognaise', price: 30, description: 'Sauce Tomate, viande, basilic', available: true, stockQty: 999, image: '/menu/spaghetti_bolognaise.jpg' },
        { id: uid(), categoryId: 'cat-pasta', name: 'Pâtes Thon', price: 25, description: 'Sauce Tomate, thon, basilic', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-pasta', name: 'Pâtes Fruits de Mer', price: 40, description: 'Sauce, fruits de Mer', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-pasta', name: 'Pâtes Végétarien', price: 25, description: 'Aubergine, Oignon, cerise, Courgette', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-pasta', name: 'Carbonara', price: 30, description: 'Sauce blanche, jombo, Champignons', available: true, stockQty: 999, image: '/menu/penne_jambon_champignon.jpg' },
        { id: uid(), categoryId: 'cat-pasta', name: 'Poulet Champignons', price: 30, description: 'Sauce blanche, Champignons, poulet, Oignon', available: true, stockQty: 999, image: '/menu/tagliatelle_poulet_champignon.jpg' },
        { id: uid(), categoryId: 'cat-pasta', name: 'Saumon', price: 50, description: 'Sauce blanche, Saumon', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=60' },

        // ===== MAIN DISHES =====
        { id: uid(), categoryId: 'cat-mains', name: 'Cordon Blue', price: 35, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-mains', name: 'Emincés de Poulet', price: 35, description: '', available: true, stockQty: 999, image: '/menu/emince_poulet.jpg' },
        { id: uid(), categoryId: 'cat-mains', name: 'Brochette Boeuf', price: 40, description: '', available: true, stockQty: 999, image: '/menu/brochette_viande.jpg' },
        { id: uid(), categoryId: 'cat-mains', name: 'Brochette Poulet', price: 40, description: '', available: true, stockQty: 999, image: '/menu/brochette_poulet.jpg' },
        { id: uid(), categoryId: 'cat-mains', name: 'Mix Grille', price: 50, description: '2 brochette poulet + 2 boeuf + 2 viande haché', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-mains', name: 'Accompagnement', price: 10, description: 'Frite, pâte, riz, légumes, Purée', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-mains', name: 'Sauce Fromage', price: 10, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1472476443507-c7a392dd12c7?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-mains', name: 'Sauce Champignons', price: 10, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1472476443507-c7a392dd12c7?auto=format&fit=crop&w=500&q=60' },

        // ===== OFANDUE =====
        { id: uid(), categoryId: 'cat-ofandue', name: 'Bowritoo Poulet', price: 30, description: 'Pâte à pizza', available: true, stockQty: 999, image: '/menu/bowritoo.jpg' },
        { id: uid(), categoryId: 'cat-ofandue', name: 'Bowritoo Viande', price: 30, description: 'Pâte à pizza', available: true, stockQty: 999, image: '/menu/bowritoo.jpg' },
        { id: uid(), categoryId: 'cat-ofandue', name: 'Bowritoo Mix', price: 35, description: 'Pâte à pizza', available: true, stockQty: 999, image: '/menu/bowritoo.jpg' },
        { id: uid(), categoryId: 'cat-ofandue', name: 'Bowghroom', price: 30, description: 'Poulet panné, cordon bleu, cheddar, frite, sauce fromagère', available: true, stockQty: 999, image: '/menu/bowghroom.jpg' },
        { id: uid(), categoryId: 'cat-ofandue', name: 'Pasticcio Poulet', price: 35, description: 'Base au choix: pâte ou frite', available: true, stockQty: 999, image: '/menu/gratin.jpg' },
        { id: uid(), categoryId: 'cat-ofandue', name: 'Pasticcio Viande', price: 35, description: 'Base au choix: pâte ou frite', available: true, stockQty: 999, image: '/menu/gratin.jpg' },
        { id: uid(), categoryId: 'cat-ofandue', name: 'Pasticcio Fruit de Mer', price: 40, description: 'Base au choix: pâte ou frite', available: true, stockQty: 999, image: '/menu/gratin.jpg' },
        { id: uid(), categoryId: 'cat-ofandue', name: 'Lasagne Bolognaise', price: 35, description: 'Sauce bolognaise, béchamel, pâte lasagne, fromage', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=500&q=60' },

        // ===== SANDWICHES =====
        // ===== SANDWICHES =====
        { id: uid(), categoryId: 'cat-sandwich', name: 'Tacos Poulet', nameAr: 'تاكوس دجاج', price: 30, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1624300603538-1207400f1807?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Tacos Viande', nameAr: 'تاكوس لحم', price: 30, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1624300603538-1207400f1807?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Tacos Mix', nameAr: 'تاكوس ميكس', price: 35, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1624300603538-1207400f1807?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Burger Chicken', nameAr: 'برجر دجاج', price: 30, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Burger Cheese', nameAr: 'تشيز برجر', price: 30, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Burger Master Class', nameAr: 'ماستر برجر', price: 40, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Sandwich Thon', nameAr: 'سندويش تونة', price: 25, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1624300603538-1207400f1807?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Sandwich Viande', nameAr: 'سندويش لحم', price: 30, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1624300603538-1207400f1807?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Sandwich Poulet', nameAr: 'سندويش دجاج', price: 30, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1624300603538-1207400f1807?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Chawarma Normale', nameAr: 'شاورما عادية', price: 30, description: 'Shawarma poulet, salade, tomate, sauce', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1624300603538-1207400f1807?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Chawarma Fromage', nameAr: 'شاورما جبن', price: 30, description: 'Chawarma poulet, salade, tomate, fromage, sauce', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1624300603538-1207400f1807?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Panini Poulet', nameAr: 'بانيني دجاج', price: 25, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1624300603538-1207400f1807?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Panini Viande', nameAr: 'بانيني لحم', price: 25, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1624300603538-1207400f1807?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Panini Thon', nameAr: 'بانيني تونة', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1624300603538-1207400f1807?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-sandwich', name: 'Panini Fromage', nameAr: 'بانيني جبن', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1624300603538-1207400f1807?auto=format&fit=crop&w=500&q=60' },

        // ===== JUICES & SMOOTHIES =====
        { id: uid(), categoryId: 'cat-juices', name: 'Jus Orange', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Jus Fraise', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Jus Mangue', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Jus Ananas', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Jus Avocat', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Jus Pomme', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Jus Pêche', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Jus Banane', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Jus Betterave', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Jus Concombre', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Jus Carotte', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Mojito', price: 20, description: '', available: true, stockQty: 999, image: '/menu/mojito.jpg' },
        { id: uid(), categoryId: 'cat-juices', name: 'Mojito Fruit Rouge', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Smoothie Panché', price: 15, description: 'Jus au choix 4 fruits', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Smoothie Tropical', price: 20, description: 'Mangue, Ananas, Passion', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Smoothie Red', price: 20, description: 'Betterave, Banane, Fraise, Carotte', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-juices', name: 'Smoothie Détox', price: 20, description: 'Concombre, Citron, Gingembre, Menthe', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=500&q=60' },

        // ===== DRINKS =====
        { id: uid(), categoryId: 'cat-drinks', name: 'Café Noir', price: 12, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Nexpresso', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Americano', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Cappuccino', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Nas Nas', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1605942002814-b852b0873304?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Café Crème', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1605942002814-b852b0873304?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Ice Café', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1517701550927-30cf4bb1dba5?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Chocolat Chaud', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1637572815755-c4b80092dce1?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Lait Chaud', price: 12, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1576186726115-4d51596775d1?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Thé à la Menthe', price: 12, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Verveine', price: 12, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1504382103100-db7e92322d39?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Infusions', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1504382103100-db7e92322d39?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Soda', price: 10, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1592253167780-ff4439df5fcc?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Orangina', price: 12, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1637178921831-16034c8c7705?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Eau 33cl', price: 5, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1625708458528-802ec79b1ed8?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Eau 50cl', price: 8, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1625708458528-802ec79b1ed8?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Eau 1.5L', price: 12, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1625708458528-802ec79b1ed8?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Oulmes 50cl', price: 10, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1517093911940-08cb5b3952e7?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-drinks', name: 'Oulmes 1.5L', price: 12, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1517093911940-08cb5b3952e7?auto=format&fit=crop&w=500&q=60' },

        // ===== DESSERTS =====
        { id: uid(), categoryId: 'cat-desserts', name: 'Salade de Fruits', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Tiramisu', price: 25, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Cheesecake', price: 25, description: 'Fraise ou Citron', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1533139502658-afee996175a9?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Panna Cotta', price: 25, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1488477181946-6428a029177b?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Mousse Chocolat', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Tarte', price: 25, description: 'Citron / Fruits / Amandes', available: true, stockQty: 999, image: '/menu/tarte.jpg' },
        { id: uid(), categoryId: 'cat-desserts', name: '1 Boule Glace', price: 10, description: 'Chocolat, Fraise, Vanille', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: '2 Boules Glace', price: 15, description: 'Chocolat, Fraise, Vanille', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: '3 Boules Glace', price: 20, description: 'Chocolat, Fraise, Vanille', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Crêpe Sucre/Miel', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Crêpe Nutella', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Crêpe Nutella Banane', price: 23, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Crêpe Nutella Fruits', price: 25, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Gaufre Sucre', price: 15, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Gaufre Chocolat', price: 23, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Gaufre Fruits', price: 20, description: '', available: true, stockQty: 999, image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=500&q=60' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Pancake Miel', price: 15, description: '', available: true, stockQty: 999, image: '/menu/pancake.jpg' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Pancake Chocolat', price: 20, description: '', available: true, stockQty: 999, image: '/menu/pancake.jpg' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Pancake Fruits', price: 20, description: '', available: true, stockQty: 999, image: '/menu/pancake.jpg' },
    ];

    if (count === 0) {
        await db.menuItems.bulkAdd(items);
    }

    // Check if we need to migrate existing data (add nameAr)
    const existingCats = await db.categories.toArray();
    for (const cat of existingCats) {
        if (!cat.nameAr) {
            const seedCat = cats.find(c => c.id === cat.id);
            if (seedCat && seedCat.nameAr) {
                await db.categories.update(cat.id, { nameAr: seedCat.nameAr });
            }
        }
    }

    const existingItems = await db.menuItems.toArray();
    for (const item of existingItems) {
        const seedItem = items.find(i => i.name === item.name);
        if (seedItem) {
            const updates = {};
            if (seedItem.nameAr && item.nameAr !== seedItem.nameAr) updates.nameAr = seedItem.nameAr;
            if (seedItem.image && item.image !== seedItem.image) updates.image = seedItem.image;
            if (Object.keys(updates).length > 0) {
                await db.menuItems.update(item.id, updates);
            }
        }
    }

    // ===== SEED DEFAULT SETTINGS =====
    const defaultSettings = [
        { key: 'storeName', value: 'MASTER CLASS' },
        { key: 'storeSubtitle', value: 'RESTAURANT & CAFÉ' },
        { key: 'storeAddress', value: '123 Avenue Mohammed VI, Marrakech' },
        { key: 'storePhone', value: '05 24 00 00 00' },
        { key: 'wifiName', value: 'MasterClass_Guest' },
        { key: 'wifiPassword', value: 'Password123' },
        { key: 'receiptFooter', value: 'Merci de votre visite!' },
        { key: 'receiptPoweredBy', value: 'Powered by MasterPOS' },
    ];
    for (const s of defaultSettings) {
        const existing = await db.settings.get(s.key);
        if (!existing) {
            await db.settings.put(s);
        }
    }

    console.log('Database seeded with', items.length, 'menu items');
}
