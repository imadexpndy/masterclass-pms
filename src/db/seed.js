import db from './db';

const uid = () => crypto.randomUUID();

export async function seedDatabase() {
    // ===== FORCE RESET FOR NEW MENU =====
    if (window.localStorage.getItem('almisk_menu_reset_v3') !== 'true') {
        console.log("Forcing menu reset for new Almisk menu...");
        await db.categories.clear();
        await db.menuItems.clear();
        window.localStorage.setItem('almisk_menu_reset_v3', 'true');
    }

    const count = await db.categories.count();
    const tableCount = await db.diningTables.count();

    if (count === 0) {
        // ===== DEFAULT ADMIN USER =====
        await db.users.bulkAdd([
            { id: uid(), name: 'Admin', pin: '1234', role: 'admin', active: true },
            { id: uid(), name: 'Serveur 1', pin: '1111', role: 'waiter', active: true },
            { id: uid(), name: 'Caissier 1', pin: '2222', role: 'cashier', active: true },
            { id: uid(), name: 'Cuisine', pin: '3333', role: 'kitchen', active: true },
        ]);

        // ===== CATEGORIES & MENU ITEMS =====
        const cats = [
            { id: 'cat-entrees-marocaines', name: 'Entrées Marocaines', nameAr: 'مقبلات مغربية', iconKey: 'tagine', sortOrder: 1 },
            { id: 'cat-entrees-internationales', name: 'Entrées Internationales', nameAr: 'مقبلات عالمية', iconKey: 'salad', sortOrder: 2 },
            { id: 'cat-table-marocaine', name: 'Table Marocaine', nameAr: 'المائدة المغربية', iconKey: 'tagine', sortOrder: 3 },
            { id: 'cat-table-internationale', name: 'Table Internationale', nameAr: 'المائدة العالمية', iconKey: 'steak', sortOrder: 4 },
            { id: 'cat-desserts', name: 'Desserts', nameAr: 'تحليات', iconKey: 'dessert', sortOrder: 5 },
            { id: 'cat-menus', name: 'Menus / Set Menus', nameAr: 'قوائم', iconKey: 'pasta', sortOrder: 6 },
            { id: 'cat-boissons-chaudes', name: 'Boissons Chaudes', nameAr: 'مشروبات ساخنة', iconKey: 'coffee', sortOrder: 7 },
            { id: 'cat-boissons', name: 'Boissons', nameAr: 'مشروبات', iconKey: 'juice', sortOrder: 8 },
            { id: 'cat-jus', name: 'Jus de Fruits Frais', nameAr: 'عصائر طازجة', iconKey: 'juice', sortOrder: 9 },
            { id: 'cat-cocktails', name: 'Cocktails & Vitamines', nameAr: 'كوكتيلات وفيتامينات', iconKey: 'juice', sortOrder: 10 },
        ];
        await db.categories.bulkAdd(cats);
    }

    // ===== TABLES — Rooftop only, 12 tables =====
    const tablesResetDone = window.localStorage.getItem('almisk_tables_reset_v2') === 'true';
    if (!tablesResetDone) {
        await db.diningTables.clear();
        console.log('Seeding 12 rooftop tables...');

        const rooftopTables = [];
        let tableNum = 1;
        // 4 columns × 3 rows = 12 tables
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                rooftopTables.push({
                    id: uid(),
                    name: `T-${tableNum++}`,
                    status: 'free',
                    seats: 4,
                    zone: 'terrasse',
                    row,
                    col,
                    type: 'table',
                });
            }
        }

        await db.diningTables.bulkAdd(rooftopTables);
        window.localStorage.setItem('almisk_tables_reset_v2', 'true');
    }

    const items = [
        // ===== ENTRÉES MAROCAINES / MOROCCAN STARTERS =====
        { id: uid(), categoryId: 'cat-entrees-marocaines', name: 'Harira Marocaine - Soupe', nameAr: 'حريرة مغربية - حساء', price: 50, description: 'Dattes et chbbakiya, œuf dur / Dattes, chbbakiya and boiled Egg', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-entrees-marocaines', name: 'Assortiment de salades marocaines', nameAr: 'تشكيلة سلطات مغربية', price: 70, description: 'Courgettes / Tomates poivron / Taktouka / Hommous / Zaalouk / Carottes marinées aux herbes et ail / Tomates confites / Carottes confites / Potiron confit / Oignons confits au raisin / Houmous / Poivrons marinés à l\'huile d\'olive et ails / Epinards', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-entrees-marocaines', name: 'Assortiment de 6 Briwates', nameAr: 'تشكيلة 6 بريوات', price: 90, description: 'Epinards, poulet, légumes et viande hachée / Chicken briwat, Spinach and cheese briwat, Vegetables and minced meat', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-entrees-marocaines', name: 'Assortiment de 6 cigares', nameAr: 'تشكيلة 6 سيكار', price: 90, description: 'Épinards, poulet, légumes / Chicken, Spinach & Vegetables', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-entrees-marocaines', name: 'Pastilla royale de poulet aux amandes', nameAr: 'بسطيلة ملكية بالدجاج واللوز', price: 90, description: 'Royal chicken pastilla with almonds', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-entrees-marocaines', name: 'Pastilla fruits de mer', nameAr: 'بسطيلة فواكه البحر', price: 110, description: 'Pastilla farcie aux fruits de mer, poisson blanc et vermicelles / Sea food pastilla with Vermicelli', available: true, stockQty: 999, image: '' },

        // ===== ENTRÉES INTERNATIONALES / INTERNATIONAL STARTERS =====
        { id: uid(), categoryId: 'cat-entrees-internationales', name: 'Salades Niçoise', nameAr: 'سلطة نيسواز', price: 60, description: 'Salade verte, poivron, tomate, thon, œufs, olives noires, carotte, pomme de terre / Green salad, pepper, tomato, tuna, eggs, black olives, carrot, potato', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-entrees-internationales', name: 'Avocado Salad', nameAr: 'سلطة أفوكادو', price: 70, description: 'Avocat, concombre, ognon, tomate, salade verte sauce pesto / Avocado, cucumber, onion, tomato, green salad with pesto sauce', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-entrees-internationales', name: 'Quinoa Salad', nameAr: 'سلطة كينوا', price: 80, description: 'Quinoa, poivron, mangue, maïs, thon, ognon, avocat / Quinoa, sweet pepper, mango, corn, onion, avocado, tuna', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-entrees-internationales', name: 'Quinoa aux légumes grillés', nameAr: 'كينوا بالخضر المشوية', price: 85, description: 'Quinoa, aubergine, carottes, courgettes, poivrons, sauce pesto, tomates cerises / Quinoa, eggplant, carrots, zucchini, peppers, Pesto sauce, cherry tomatoes', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-entrees-internationales', name: 'Salade Royale Almisk', nameAr: 'سلطة رويال المسك', price: 95, description: 'Salade verte, tomates cerises confites, concombre, maïs, avocat, gambas, poivron, croutons à l\'ail, noix, amandes, raisins secs, cœur de palmier, haricots rouges, ognon caramélisé', available: true, stockQty: 999, image: '' },

        // ===== TABLE MAROCAINE / MOROCCAN TABLE =====
        { id: uid(), categoryId: 'cat-table-marocaine', name: 'Tagine berbère aux légumes', nameAr: 'طاجين بربري بالخضر', price: 90, description: 'Tagine berbère aux légumes de l\'atlas et l\'huile d\'argan', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-table-marocaine', name: 'Tagine poulet olives citrons confits', nameAr: 'طاجين دجاج بالزيتون والحامض', price: 100, description: 'Tagine de poulet aux olives, citrons confits et frites', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-table-marocaine', name: 'Tajine kefta traditionnel aux œufs', nameAr: 'طاجين كفتة بالبيض', price: 120, description: 'Traditional Kefta tagine with eggs', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-table-marocaine', name: 'Seffa Medfouna', nameAr: 'سفة مدفونة', price: 140, description: 'Seffa Medfouna aux amandes et Poulet parfumé à la cannelle', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-table-marocaine', name: 'Couscous végétarien', nameAr: 'كسكس نباتي', price: 150, description: 'Vegetarian couscous', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-table-marocaine', name: 'Tajine d\'agneau ou bœuf pruneaux', nameAr: 'طاجين لحم بالبرقوق', price: 150, description: 'Tajine d\'agneau ou bœuf amandes grilles, pruneaux, sésame', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-table-marocaine', name: 'Tanjia marrakchia', nameAr: 'طنجية مراكشية', price: 175, description: 'Tanjia marrakchia de jarret de veau au citron confit', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-table-marocaine', name: 'Couscous Royal aux légumes', nameAr: 'كسكس رويال', price: 180, description: 'au poulet ou agneau ou bœuf avec raisins sec, amandes grillées et ognon caramélisés', available: true, stockQty: 999, image: '' },

        // ===== TABLE INTERNATIONALE / INTERNATIONAL TABLE =====
        { id: uid(), categoryId: 'cat-table-internationale', name: 'Sandwich, Panini, Tacos', nameAr: 'سندويتش، بانيني، تاكوس', price: 85, description: 'Poulet, nuggets, viande hachée, mixte avec frites', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-table-internationale', name: 'Spaghetti, Penné ou tagliatelle', nameAr: 'سباغيتي، بيني، تالياتيلي', price: 90, description: 'Bolognaise, tomates cerises, herbes, ail et fromage, Champignon, poulet sauce blanche', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-table-internationale', name: 'Emincé de poulet / bœuf sauce blanche', nameAr: 'شرائح دجاج/لحم بالصلصة البيضاء', price: 120, description: 'à la sauce blanche et champignons. Accompagnement : purée, Légumes, frites, riz', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-table-internationale', name: 'Grillade poulet, kefta, côtelettes', nameAr: 'مشويات', price: 160, description: 'ou mixte. Accompagnement : purée de pomme de terre ou légumes sautés', available: true, stockQty: 999, image: '' },

        // ===== DESSERTS / DESSERTS =====
        { id: uid(), categoryId: 'cat-desserts', name: 'Boule de glace', nameAr: 'كرة مثلجات', price: 20, description: 'Pistache, chocolat, vanille, mangue, fraise, nougat, straciatella', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Oranges à la cannelle', nameAr: 'برتقال بالقرفة', price: 40, description: 'Oranges à la cannelle et eau de fleur d\'oranger', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Salade de fruits de saison', nameAr: 'سلطة فواكه الموسم', price: 50, description: 'Seasonal fruit salad', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Crêpes au Nutella', nameAr: 'كريب نوتيلا', price: 50, description: 'banane ou fruits rouge', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Poire à la cannelle', nameAr: 'إجاص بالقرفة', price: 60, description: 'Poire à la cannelle caramélisée et à la fleur d\'oranger', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Tarte de fruits', nameAr: 'تارت الفواكه', price: 60, description: 'Fruit tart', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Crème brûlée', nameAr: 'كريم بروليه', price: 60, description: 'Cream brulee', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Gâteaux marocains aux amandes', nameAr: 'حلويات مغربية باللوز', price: 60, description: 'Sélection de gâteaux marocains aux amandes', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Panna cotta au coulis à l\'orange', nameAr: 'بنا كوتا بالبرتقال', price: 60, description: 'Panna cotta with orange coulis', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Fondant au chocolat', nameAr: 'فوندان شوكولا', price: 70, description: 'Avec boule de glace vanille', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-desserts', name: 'Pastilla au lait (Jawhara)', nameAr: 'بسطيلة بالحليب (جوهرة)', price: 75, description: 'Pastilla with milk cream', available: true, stockQty: 999, image: '' },

        // ===== MENUS / SET MENUS =====
        { id: uid(), categoryId: 'cat-menus', name: 'Le Traditionnel', nameAr: 'التقليدي', price: 250, description: 'Zaalouk, Caviar d\'aubergine, Salade tomate / Tagine poulet citrons confits / Oranges ou Salade de fruits', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-menus', name: 'La Kasbah', nameAr: 'القصبة', price: 300, description: '3 salade Marocaines / Seffa Medfouna ou Tride poulet / Gâteaux marocains ou Poire à la cannelle', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-menus', name: 'Le Marrakchi', nameAr: 'المراكشي', price: 350, description: 'Briouates variés / Tangia Marrakchia boeuf ou Makfoul d\'Agneau / Oranges ou Pastilla au lait', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-menus', name: 'Royal Almisk', nameAr: 'رويال المسك', price: 400, description: 'Pastilla royale poulet / Tajine agneau/bœuf ou Couscous Royal / Tarte de fruits ou Panna cotta', available: true, stockQty: 999, image: '' },

        // ===== BOISSONS CHAUDES =====
        { id: uid(), categoryId: 'cat-boissons-chaudes', name: 'Nespresso', nameAr: 'نسبريسو', price: 25, description: 'Avec gâteaux marocains', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-boissons-chaudes', name: 'Chocolat chaud', nameAr: 'شوكولا ساخنة', price: 25, description: 'Avec gâteaux marocains', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-boissons-chaudes', name: 'Café aux épices', nameAr: 'قهوة بالتوابل', price: 25, description: 'Avec gâteaux marocains', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-boissons-chaudes', name: 'Café au lait', nameAr: 'قهوة بالحليب', price: 25, description: 'Avec gâteaux marocains', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-boissons-chaudes', name: 'Lait à la verveine', nameAr: 'حليب بالويزة', price: 25, description: 'Avec gâteaux marocains', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-boissons-chaudes', name: 'Tisane relaxante', nameAr: 'تيزانة', price: 25, description: 'Avec gâteaux marocains', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-boissons-chaudes', name: 'Thé Lipton', nameAr: 'شاي ليبتون', price: 25, description: 'Avec gâteaux marocains', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-boissons-chaudes', name: 'Thé à la menthe', nameAr: 'أتاي بالنعناع', price: 25, description: 'Avec gâteaux marocains', available: true, stockQty: 999, image: '' },

        // ===== BOISSONS =====
        { id: uid(), categoryId: 'cat-boissons', name: 'Eau minérale 50cl / Oulmes 50cl', nameAr: 'ماء معدني 50سل / أولماس 50سل', price: 10, description: 'Eau mineral 50cl / Oulmes 50cl', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-boissons', name: 'Sodas assortis', nameAr: 'مشروب غازي', price: 20, description: 'Coca, coca zero - Diet coke, Sprite, Hawai, Pom\'s, Schweppes – Schweppes citron, Fanta orange, Fanta citron', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-boissons', name: 'Eau minérale 1L / Oulmes 75cl', nameAr: 'ماء معدني 1 لتر / أولماس 75سل', price: 20, description: 'Eau mineral 1L / Oulmes 75cl', available: true, stockQty: 999, image: '' },

        // ===== JUS DE FRUITS FRAIS =====
        { id: uid(), categoryId: 'cat-jus', name: 'Jus d\'Orange', nameAr: 'عصير برتقال', price: 35, description: '', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-jus', name: 'Jus de citron', nameAr: 'عصير ليمون', price: 35, description: '', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-jus', name: 'Jus de banane', nameAr: 'عصير موز', price: 35, description: '', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-jus', name: 'Jus de fraise', nameAr: 'عصير فراولة', price: 40, description: '', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-jus', name: 'Jus de pamplemousse', nameAr: 'عصير كريفون', price: 40, description: '', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-jus', name: 'Jus de pêche', nameAr: 'عصير خوخ', price: 40, description: '', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-jus', name: 'Jus d\'avocat', nameAr: 'عصير أفوكادو', price: 50, description: '', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-jus', name: 'Jus de mangue', nameAr: 'عصير مانجو', price: 50, description: '', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-jus', name: 'Jus d\'ananas', nameAr: 'عصير أناناس', price: 50, description: '', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-jus', name: 'Jus de carotte', nameAr: 'عصير جزر', price: 50, description: '', available: true, stockQty: 999, image: '' },

        // ===== COCKTAILS & VITAMINES =====
        { id: uid(), categoryId: 'cat-cocktails', name: 'Signature AL MISK', nameAr: 'سيكناتور المسك', price: 75, description: 'Carotte, cannelle, citron, mangue, orange, gingembre, fruit de passion', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-cocktails', name: 'Signature LA KASBAH', nameAr: 'سيكناتور القصبة', price: 75, description: 'Betterave, pomme verte, gingembre, orange', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-cocktails', name: 'Signature LA MENARA', nameAr: 'سيكناتور المنارة', price: 75, description: 'Concombre, kiwi, pomme verte, gingembre, citron, yaourt', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-cocktails', name: 'Mocktail BAHJA', nameAr: 'موكتيل البهجة', price: 50, description: 'Pamplemousse, citron, fruit de passion', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-cocktails', name: 'Mocktail MAMOUNIA', nameAr: 'موكتيل المامونية', price: 50, description: 'Pamplemousse, citron, fruit de passion', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-cocktails', name: 'Mocktail MAJORELLE', nameAr: 'موكتيل ماجوريل', price: 50, description: 'Concombre, feuille de menthe, citron, fleur d\'oranger, Sprite, gingembre', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-cocktails', name: 'Mocktail MACHWAR', nameAr: 'موكتيل المشور', price: 50, description: 'Citron, feuille de menthe, citron, sirop de fraise, Sprite', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-cocktails', name: 'Mocktail LA MEDINA', nameAr: 'موكتيل المدينة', price: 50, description: 'Citron, feuille de menthe, sirop de menthe, Sprite', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-cocktails', name: 'Mocktail BAB AGNAOU', nameAr: 'موكتيل باب أكناو', price: 50, description: 'Jus d\'ananas, lait de coco', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-cocktails', name: 'Mocktail KOUTOUBIA', nameAr: 'موكتيل الكتبية', price: 50, description: 'Jus de citron, jus d\'ananas, blanc d\'œuf, fleur d\'oranger, sirop de fraise', available: true, stockQty: 999, image: '' },
        { id: uid(), categoryId: 'cat-cocktails', name: 'Mocktail MY ELYAZID', nameAr: 'موكتيل مولاي اليزيد', price: 50, description: 'Jus de citron, tranche de citron, gingembre, eau gazeuse', available: true, stockQty: 999, image: '' },
    ];

    if (count === 0) {
        await db.menuItems.bulkAdd(items);
    }

    // ===== SEED DEFAULT SETTINGS =====
    const defaultSettings = [
        { key: 'storeName', value: 'RIAD AL MISK' },
        { key: 'storeSubtitle', value: 'RESTAURANT' },
        { key: 'storeAddress', value: '362 rue de la Kasbah, Médina - Marrakech' },
        { key: 'storePhone', value: '05 24 44 08 71' },
        { key: 'wifiName', value: 'RiadAlMisk_Guest' },
        { key: 'wifiPassword', value: 'Password123' },
        { key: 'receiptFooter', value: 'Thank you for your visit!' },
        { key: 'receiptPoweredBy', value: 'Powered by Expndy' },
    ];
    for (const s of defaultSettings) {
        const existing = await db.settings.get(s.key);
        if (!existing) {
            await db.settings.put(s);
        }
    }


    console.log('Database seeded with', items.length, 'menu items');
}
