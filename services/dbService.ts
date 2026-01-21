
import { User, AdPartner, SystemVersion, AdPricingConfig, Testimonial, TrustedCompany } from '../types';

const DB_NAME = 'ViralizaDB';
const DB_VERSION = 4; 
const USERS_STORE_NAME = 'users';
const PARTNERS_STORE_NAME = 'partners';
const TESTIMONIALS_STORE_NAME = 'testimonials';
const TRUSTED_COMPANIES_STORE_NAME = 'trusted_companies';
const LOCAL_STORAGE_BACKUP_KEY = 'viraliza_users_backup_v2';
const PERSISTENT_STORAGE_KEY = 'viraliza_persistent_data_v1';
const AD_PRICING_KEY = 'viraliza_ad_pricing_config';

let db: IDBDatabase;

const initialUsers: User[] = [
    { 
        id: 'usr_admin_master', 
        name: 'Administrador', 
        email: 'admin@viraliza.ai', 
        type: 'admin', 
        status: 'Ativo', 
        joinedDate: '2023-01-01',
        password: 'admin123',
        avatar: 'https://i.pravatar.cc/150?u=admin'
    },
    { 
        id: 'usr_client_demo', 
        name: 'Conta Demonstração', 
        email: 'demo@viraliza.ai', 
        type: 'client', 
        plan: 'Mensal', 
        status: 'Ativo', 
        joinedDate: '2023-01-15',
        cnpj: '00.000.000/0001-00',
        socialAccounts: [],
        paymentMethods: [],
        billingHistory: [],
        password: 'demo',
        avatar: 'https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?s=200',
    }
];

const initialPartners: AdPartner[] = [
    {
        id: 'ad_demo_1',
        companyName: 'TechStart Solutions',
        role: 'Inovação & TI',
        logo: 'https://cdn-icons-png.flaticon.com/512/3094/3094826.png', 
        websiteUrl: 'https://example.com',
        status: 'Active',
        planType: 'Monthly',
        paymentStatus: 'Paid',
        joinedDate: new Date().toISOString(),
        isMock: true
    },
    {
        id: 'ad_demo_2',
        companyName: 'Bella Vita Moda',
        role: 'Estilo Sustentável',
        logo: 'https://cdn-icons-png.flaticon.com/512/3531/3531759.png',
        websiteUrl: 'https://example.com',
        status: 'Active',
        planType: 'Monthly',
        paymentStatus: 'Paid',
        joinedDate: new Date().toISOString(),
        isMock: true
    },
    {
        id: 'ad_demo_3',
        companyName: 'FitLife Academy',
        role: 'Alta Performance',
        logo: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
        websiteUrl: 'https://example.com',
        status: 'Active',
        planType: 'Monthly',
        paymentStatus: 'Paid',
        joinedDate: new Date().toISOString(),
        isMock: true
    },
    {
        id: 'ad_demo_4',
        companyName: 'Gourmet Express',
        role: 'Gastronomia',
        logo: 'https://cdn-icons-png.flaticon.com/512/706/706164.png',
        websiteUrl: 'https://example.com',
        status: 'Active',
        planType: 'Monthly',
        paymentStatus: 'Paid',
        joinedDate: new Date().toISOString(),
        isMock: true
    }
];

const initialTrustedCompanies: TrustedCompany[] = [
    { id: 'tc_1', name: 'Microsoft', url: 'https://microsoft.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/09/Microsoft-Logo.png' },
    { id: 'tc_2', name: 'Google', url: 'https://google.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/09/Google-Logo.png' },
    { id: 'tc_3', name: 'Amazon', url: 'https://amazon.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/04/Amazon-Logo.png' },
    { id: 'tc_4', name: 'Meta', url: 'https://meta.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2021/10/Meta-Logo.png' },
    { id: 'tc_5', name: 'Apple', url: 'https://apple.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/04/Apple-Logo.png' },
    { id: 'tc_6', name: 'Tesla', url: 'https://tesla.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/09/Tesla-Logo.png' },
    { id: 'tc_7', name: 'Netflix', url: 'https://netflix.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/04/Netflix-Logo.png' },
    { id: 'tc_8', name: 'Spotify', url: 'https://spotify.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Spotify-Logo.png' },
    { id: 'tc_9', name: 'Adobe', url: 'https://adobe.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/11/Adobe-Logo.png' },
    { id: 'tc_10', name: 'Salesforce', url: 'https://salesforce.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/09/Salesforce-Logo.png' },
    { id: 'tc_11', name: 'Oracle', url: 'https://oracle.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/09/Oracle-Logo.png' },
    { id: 'tc_12', name: 'IBM', url: 'https://ibm.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/09/IBM-Logo.png' },
    { id: 'tc_13', name: 'Intel', url: 'https://intel.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/03/Intel-Logo.png' },
    { id: 'tc_14', name: 'NVIDIA', url: 'https://nvidia.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/09/Nvidia-Logo.png' },
    { id: 'tc_15', name: 'Samsung', url: 'https://samsung.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/04/Samsung-Logo.png' },
    { id: 'tc_16', name: 'Sony', url: 'https://sony.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Sony-Logo.png' },
    { id: 'tc_17', name: 'Uber', url: 'https://uber.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/05/Uber-Logo.png' },
    { id: 'tc_18', name: 'Airbnb', url: 'https://airbnb.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/10/Airbnb-Logo.png' },
    { id: 'tc_19', name: 'PayPal', url: 'https://paypal.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/07/PayPal-Logo.png' },
    { id: 'tc_20', name: 'Shopify', url: 'https://shopify.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/11/Shopify-Logo.png' },
    { id: 'tc_21', name: 'Zoom', url: 'https://zoom.us', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2021/02/Zoom-Logo.png' },
    { id: 'tc_22', name: 'Slack', url: 'https://slack.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/12/Slack-Logo.png' },
    { id: 'tc_23', name: 'Dropbox', url: 'https://dropbox.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/03/Dropbox-Logo.png' },
    { id: 'tc_24', name: 'Twitter', url: 'https://twitter.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/04/Twitter-Logo.png' },
    { id: 'tc_25', name: 'LinkedIn', url: 'https://linkedin.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/05/LinkedIn-Logo.png' },
    { id: 'tc_26', name: 'TikTok', url: 'https://tiktok.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/09/TikTok-Logo.png' },
    { id: 'tc_27', name: 'Instagram', url: 'https://instagram.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/04/Instagram-Logo.png' },
    { id: 'tc_28', name: 'WhatsApp', url: 'https://whatsapp.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/05/WhatsApp-Logo.png' },
    { id: 'tc_29', name: 'YouTube', url: 'https://youtube.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/04/YouTube-Logo.png' },
    { id: 'tc_30', name: 'Discord', url: 'https://discord.com', status: 'Active', logo: 'https://logos-world.net/wp-content/uploads/2020/12/Discord-Logo.png' },
];


// --- Backup Helpers (Dual Layer Storage) ---
const saveUsersToBackup = (users: User[]) => {
    try {
        // Remove large base64 images if storage quota is exceeded, prioritizing account data
        try {
            localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(users));
        } catch (e) {
            // Fallback: Save without heavy avatars if full
            const lightUsers = users.map(u => ({ ...u, avatar: '' }));
            localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(lightUsers));
        }
    } catch (e) {
        console.warn("LocalStorage full or disabled", e);
    }
};

// --- Sistema de Persistência Permanente ---
const savePersistentData = (users: User[]) => {
    try {
        const persistentData = {
            users: users,
            timestamp: Date.now(),
            version: '1.0'
        };
        
        // Salvar em múltiplos locais para garantir persistência
        localStorage.setItem(PERSISTENT_STORAGE_KEY, JSON.stringify(persistentData));
        sessionStorage.setItem(PERSISTENT_STORAGE_KEY, JSON.stringify(persistentData));
        
        // Salvar também com timestamp para backup rotativo
        const timestampKey = `${PERSISTENT_STORAGE_KEY}_${Date.now()}`;
        localStorage.setItem(timestampKey, JSON.stringify(persistentData));
        
        console.log('✅ Dados salvos persistentemente:', users.length, 'usuários');
    } catch (e) {
        console.error('❌ Erro ao salvar dados persistentes:', e);
    }
};

const loadPersistentData = (): User[] => {
    try {
        // Tentar carregar do localStorage primeiro
        let persistentData = localStorage.getItem(PERSISTENT_STORAGE_KEY);
        
        // Se não encontrar, tentar sessionStorage
        if (!persistentData) {
            persistentData = sessionStorage.getItem(PERSISTENT_STORAGE_KEY);
        }
        
        // Se ainda não encontrar, procurar backups com timestamp
        if (!persistentData) {
            const keys = Object.keys(localStorage).filter(key => key.startsWith(PERSISTENT_STORAGE_KEY + '_'));
            if (keys.length > 0) {
                // Pegar o backup mais recente
                const latestKey = keys.sort().pop();
                if (latestKey) {
                    persistentData = localStorage.getItem(latestKey);
                }
            }
        }
        
        if (persistentData) {
            const data = JSON.parse(persistentData);
            console.log('✅ Dados persistentes carregados:', data.users?.length || 0, 'usuários');
            return data.users || [];
        }
        
        return [];
    } catch (e) {
        console.error('❌ Erro ao carregar dados persistentes:', e);
        return [];
    }
};

const getUsersFromBackup = (): User[] => {
    try {
        const backup = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
        return backup ? JSON.parse(backup) : [];
    } catch (e) {
        return [];
    }
};

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB error:", request.error);
            reject("Erro ao abrir o banco de dados.");
        };

        request.onsuccess = (event) => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            
            if (!dbInstance.objectStoreNames.contains(USERS_STORE_NAME)) {
                const objectStore = dbInstance.createObjectStore(USERS_STORE_NAME, { keyPath: 'id' });
                objectStore.createIndex('email', 'email', { unique: true });
            }

            if (!dbInstance.objectStoreNames.contains(PARTNERS_STORE_NAME)) {
                dbInstance.createObjectStore(PARTNERS_STORE_NAME, { keyPath: 'id' });
            }

            if (!dbInstance.objectStoreNames.contains(TESTIMONIALS_STORE_NAME)) {
                dbInstance.createObjectStore(TESTIMONIALS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }

            if (!dbInstance.objectStoreNames.contains(TRUSTED_COMPANIES_STORE_NAME)) {
                const store = dbInstance.createObjectStore(TRUSTED_COMPANIES_STORE_NAME, { keyPath: 'id' });
                // Seed initial data
                initialTrustedCompanies.forEach(company => store.put(company));
            }
        };
    });
};

export const initDB = async (): Promise<void> => {
    const dbInstance = await openDB();
    
    return new Promise((resolve) => {
        const transaction = dbInstance.transaction([USERS_STORE_NAME, PARTNERS_STORE_NAME], 'readwrite');
        const userStore = transaction.objectStore(USERS_STORE_NAME);
        const partnerStore = transaction.objectStore(PARTNERS_STORE_NAME);

        // 1. Sync Users - PRIORIDADE: Dados persistentes
        const userCountRequest = userStore.count();
        userCountRequest.onsuccess = () => {
            const persistentUsers = loadPersistentData();
            const backupUsers = getUsersFromBackup();
            
            // PRIORIDADE 1: Dados persistentes (nunca perdidos)
            if (persistentUsers.length > 0) {
                console.log('🔄 Restaurando dados persistentes:', persistentUsers.length, 'usuários');
                persistentUsers.forEach(user => userStore.put(user));
                savePersistentData(persistentUsers); // Re-salvar para garantir
                console.log("✅ Database restaurado de dados PERSISTENTES.");
            }
            // PRIORIDADE 2: Backup local
            else if (backupUsers.length > 0) {
                console.log('🔄 Restaurando backup local:', backupUsers.length, 'usuários');
                backupUsers.forEach(user => userStore.put(user));
                savePersistentData(backupUsers); // Promover para persistente
                console.log("✅ Database restaurado de backup local.");
            }
            // PRIORIDADE 3: Usuários iniciais (apenas se não há nada)
            else if (userCountRequest.result === 0) {
                console.log('🔄 Criando usuários iniciais');
                initialUsers.forEach(user => userStore.add(user));
                saveUsersToBackup(initialUsers);
                savePersistentData(initialUsers); // Salvar como persistente
                console.log("✅ Database inicializado com usuários padrão.");
            }
        };

        // 2. Sync Partners (Ensure section is visible)
        const partnerCountRequest = partnerStore.count();
        partnerCountRequest.onsuccess = () => {
            // Seed if empty (or check if we need to restore deleted defaults)
            if (partnerCountRequest.result === 0) {
                initialPartners.forEach(partner => partnerStore.put(partner));
                console.log("Database seeded with initial partners.");
            }
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve(); // Resolve anyway to allow app to continue
    });
};

// NEW: Direct credential verification bypassing React State for 100% reliability
export const verifyCredentialsDB = async (email: string, password: string): Promise<User | null> => {
    try {
        // 1. Try IndexedDB
        const dbInstance = await openDB();
        const transaction = dbInstance.transaction(USERS_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(USERS_STORE_NAME);
        const request = objectStore.getAll(); 

        return new Promise((resolve) => {
            request.onsuccess = () => {
                const allUsers = request.result as User[];
                let foundUser = allUsers.find(u => 
                    u.email.trim().toLowerCase() === email.trim().toLowerCase() && 
                    u.password === password
                );
                
                // 2. If not found in DB, IMMEDIATELY check Backup (LocalStorage)
                // This saves the user if IndexedDB was cleared but LocalStorage wasn't.
                if (!foundUser) {
                    const backupUsers = getUsersFromBackup();
                    foundUser = backupUsers.find(u => 
                        u.email.trim().toLowerCase() === email.trim().toLowerCase() && 
                        u.password === password
                    );
                    
                    // If found in backup but not DB, Self-Heal the DB
                    if (foundUser) {
                        const fixTransaction = dbInstance.transaction(USERS_STORE_NAME, 'readwrite');
                        fixTransaction.objectStore(USERS_STORE_NAME).put(foundUser);
                    }
                }

                resolve(foundUser || null);
            };
            request.onerror = () => {
                 // 3. Failover to Backup on DB Error
                 const backupUsers = getUsersFromBackup();
                 const foundUser = backupUsers.find(u => 
                     u.email.trim().toLowerCase() === email.trim().toLowerCase() && 
                     u.password === password
                 );
                 resolve(foundUser || null);
            };
        });
    } catch (e) {
        // 4. Catastrophic Failure Failover
        console.error("DB Verification Error", e);
        const backupUsers = getUsersFromBackup();
        const backupUser = backupUsers.find(u => 
            u.email.trim().toLowerCase() === email.trim().toLowerCase() && 
            u.password === password
        );
        return backupUser || null;
    }
};

export const getAllUsersDB = (): Promise<User[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const dbInstance = await openDB();
            const transaction = dbInstance.transaction(USERS_STORE_NAME, 'readonly');
            const objectStore = transaction.objectStore(USERS_STORE_NAME);
            const request = objectStore.getAll();

            request.onerror = () => {
                resolve(getUsersFromBackup());
            };
            request.onsuccess = () => {
                const users = request.result;
                if (users.length === 0) {
                     // PRIORIDADE: Dados persistentes primeiro
                     const persistentUsers = loadPersistentData();
                     if (persistentUsers.length > 0) {
                         console.log('🔄 Restaurando dados persistentes no getAllUsers');
                         resolve(persistentUsers);
                         return;
                     }
                     
                     const backup = getUsersFromBackup();
                     // If DB empty but backup exists, return backup (and implicitly UI should trigger a restore later)
                     if (backup.length > 0) resolve(backup);
                     else resolve(users);
                } else {
                    // Keep backup synced on every read to ensure latest state is in LocalStorage
                    saveUsersToBackup(users);
                    savePersistentData(users); // CRÍTICO: Manter dados persistentes atualizados
                    resolve(users);
                }
            };
        } catch (e) {
             resolve(getUsersFromBackup());
        }
    });
};

export const addUserDB = (user: User): Promise<User> => {
    return new Promise(async (resolve, reject) => {
        // 1. Save to Backup IMMEDIATELY (Synchronous safety)
        const currentBackup = getUsersFromBackup();
        // Check duplicates in backup to prevent corruption
        if (!currentBackup.some(u => u.email === user.email)) {
             const updatedBackup = [...currentBackup, user];
             saveUsersToBackup(updatedBackup);
             savePersistentData(updatedBackup); // CRÍTICO: Salvar persistentemente
        }

        try {
            // 2. Save to IndexedDB
            const dbInstance = await openDB();
            const transaction = dbInstance.transaction(USERS_STORE_NAME, 'readwrite');
            const objectStore = transaction.objectStore(USERS_STORE_NAME);
            const request = objectStore.put(user); 

            request.onerror = () => {
                console.warn("IndexedDB add failed, but LocalStorage backup secured.");
                resolve(user);
            };
            request.onsuccess = () => {
                resolve(user);
            };
        } catch (e) {
             console.warn("DB Error, relying on backup", e);
             resolve(user);
        }
    });
};

export const updateUserDB = (user: User): Promise<User> => {
     return new Promise(async (resolve, reject) => {
        // 1. Update Backup IMMEDIATELY
        const currentBackup = getUsersFromBackup();
        const updatedBackup = currentBackup.map(u => u.id === user.id ? user : u);
        saveUsersToBackup(updatedBackup);
        savePersistentData(updatedBackup); // CRÍTICO: Salvar persistentemente

        try {
            const dbInstance = await openDB();
            const transaction = dbInstance.transaction(USERS_STORE_NAME, 'readwrite');
            const objectStore = transaction.objectStore(USERS_STORE_NAME);
            const request = objectStore.put(user);

            request.onerror = () => reject('Erro ao atualizar usuário.');
            request.onsuccess = () => {
                resolve(user);
            };
        } catch (e) {
            resolve(user);
        }
    });
};

export const deleteUsersDB = (userIds: string[]): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        // 1. Update Backup
        const currentBackup = getUsersFromBackup();
        const updatedBackup = currentBackup.filter(u => !userIds.includes(u.id));
        saveUsersToBackup(updatedBackup);
        savePersistentData(updatedBackup); // CRÍTICO: Salvar persistentemente

        const dbInstance = await openDB();
        const transaction = dbInstance.transaction(USERS_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(USERS_STORE_NAME);

        userIds.forEach(id => {
            objectStore.delete(id);
        });

        transaction.onerror = () => reject('Erro ao deletar usuários.');
        transaction.oncomplete = () => {
             resolve();
        };
    });
};

// ... (Keep Partner and Testimonial functions as they were, they rely on simple DB ops)
export const getPartnersDB = (): Promise<AdPartner[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const dbInstance = await openDB();
            const transaction = dbInstance.transaction(PARTNERS_STORE_NAME, 'readwrite');
            const objectStore = transaction.objectStore(PARTNERS_STORE_NAME);
            const request = objectStore.getAll();
            
            request.onsuccess = () => {
                const realPartners = request.result as AdPartner[];
                const now = new Date();
                
                realPartners.forEach(p => {
                    if (p.status === 'Active' && p.planEndDate && new Date(p.planEndDate) < now) {
                        p.status = 'Inactive';
                        objectStore.put(p); 
                    }
                });

                resolve(realPartners); 
            };
            request.onerror = () => resolve([]);
        } catch (e) {
            resolve([]);
        }
    });
};

export const getRealPartnersDB = (): Promise<AdPartner[]> => {
    return getPartnersDB();
}

export const addPartnerDB = (partner: AdPartner): Promise<AdPartner> => {
    return new Promise(async (resolve, reject) => {
        const dbInstance = await openDB();
        const transaction = dbInstance.transaction(PARTNERS_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(PARTNERS_STORE_NAME);
        const request = objectStore.put(partner);
        request.onsuccess = () => resolve(partner);
        request.onerror = () => reject('Erro ao adicionar parceiro');
    });
};

export const updatePartnerDB = (partner: AdPartner): Promise<AdPartner> => {
    return new Promise(async (resolve, reject) => {
        const dbInstance = await openDB();
        const transaction = dbInstance.transaction(PARTNERS_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(PARTNERS_STORE_NAME);
        const request = objectStore.put(partner);
        request.onsuccess = () => resolve(partner);
        request.onerror = () => reject('Erro ao atualizar parceiro');
    });
};

export const deletePartnerDB = (id: string): Promise<void> => {
     return new Promise(async (resolve, reject) => {
        const dbInstance = await openDB();
        const transaction = dbInstance.transaction(PARTNERS_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(PARTNERS_STORE_NAME);
        const request = objectStore.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Erro ao deletar parceiro');
    });
};

export const addTestimonialDB = (testimonial: Testimonial): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const dbInstance = await openDB();
            const transaction = dbInstance.transaction(TESTIMONIALS_STORE_NAME, 'readwrite');
            const objectStore = transaction.objectStore(TESTIMONIALS_STORE_NAME);
            const request = objectStore.add(testimonial);
            request.onsuccess = () => resolve();
            request.onerror = () => reject('Erro ao adicionar depoimento');
        } catch (e) {
            reject(e);
        }
    });
};

export const getTestimonialsDB = (): Promise<Testimonial[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const dbInstance = await openDB();
            const transaction = dbInstance.transaction(TESTIMONIALS_STORE_NAME, 'readonly');
            const objectStore = transaction.objectStore(TESTIMONIALS_STORE_NAME);
            const request = objectStore.getAll();
            request.onsuccess = () => resolve(request.result as Testimonial[]);
            request.onerror = () => resolve([]);
        } catch (e) {
            resolve([]);
        }
    });
};

export const checkDatabaseHealth = async (): Promise<boolean> => {
    try {
        const dbInstance = await openDB();
        const transaction = dbInstance.transaction(USERS_STORE_NAME, 'readonly');
        await new Promise((resolve, reject) => {
            const req = transaction.objectStore(USERS_STORE_NAME).count();
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(false);
        });
        return true;
    } catch (e) {
        return false;
    }
}

export const repairDatabase = async (): Promise<void> => {
    console.log("Tentando reparo via backup...");
    try {
        await initDB(); // This triggers the restore logic inside initDB
    } catch (e) {
        console.error("Reparo falhou", e);
    }
}

export const getSystemVersion = (): SystemVersion => {
    const stored = localStorage.getItem('viraliza_system_version');
    return stored ? JSON.parse(stored) : { version: '1.0.0', description: 'Lançamento Inicial', releaseDate: new Date().toISOString(), isMandatory: false };
};

export const updateSystemVersion = (version: SystemVersion) => {
    localStorage.setItem('viraliza_system_version', JSON.stringify(version));
};

export const getAdPricingConfig = (): AdPricingConfig => {
    const stored = localStorage.getItem(AD_PRICING_KEY);
    return stored ? JSON.parse(stored) : { oneWeek: 99.90, fifteenDays: 179.90, thirtyDays: 299.90 };
}

export const updateAdPricingConfig = (config: AdPricingConfig) => {
    localStorage.setItem(AD_PRICING_KEY, JSON.stringify(config));
}

// --- Trusted Companies CRUD ---

export const getTrustedCompaniesDB = (): Promise<TrustedCompany[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const dbInstance = await openDB();
            const transaction = dbInstance.transaction(TRUSTED_COMPANIES_STORE_NAME, 'readonly');
            const objectStore = transaction.objectStore(TRUSTED_COMPANIES_STORE_NAME);
            const request = objectStore.getAll();
            request.onsuccess = () => resolve(request.result as TrustedCompany[]);
            request.onerror = () => resolve([]);
        } catch (e) {
            resolve([]);
        }
    });
};

export const addTrustedCompanyDB = (company: TrustedCompany): Promise<TrustedCompany> => {
    return new Promise(async (resolve, reject) => {
        const dbInstance = await openDB();
        const transaction = dbInstance.transaction(TRUSTED_COMPANIES_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(TRUSTED_COMPANIES_STORE_NAME);
        const request = objectStore.put(company);
        request.onsuccess = () => resolve(company);
        request.onerror = () => reject('Erro ao adicionar empresa confiável');
    });
};

export const updateTrustedCompanyDB = (company: TrustedCompany): Promise<TrustedCompany> => {
    return new Promise(async (resolve, reject) => {
        const dbInstance = await openDB();
        const transaction = dbInstance.transaction(TRUSTED_COMPANIES_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(TRUSTED_COMPANIES_STORE_NAME);
        const request = objectStore.put(company);
        request.onsuccess = () => resolve(company);
        request.onerror = () => reject('Erro ao atualizar empresa confiável');
    });
};

export const deleteTrustedCompanyDB = (id: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const dbInstance = await openDB();
        const transaction = dbInstance.transaction(TRUSTED_COMPANIES_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(TRUSTED_COMPANIES_STORE_NAME);
        const request = objectStore.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Erro ao deletar empresa confiável');
    });
};
