
import { User, AdPartner, SystemVersion, AdPricingConfig, Testimonial, TrustedCompany } from '../types';

const DB_NAME = 'ViralizaDB';
const DB_VERSION = 4; 
const USERS_STORE_NAME = 'users';
const PARTNERS_STORE_NAME = 'partners';
const TESTIMONIALS_STORE_NAME = 'testimonials';
const TRUSTED_COMPANIES_STORE_NAME = 'trusted_companies';
const LOCAL_STORAGE_BACKUP_KEY = 'viraliza_users_backup_v2';
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
    { id: 'tc_1', name: 'Visionary', url: 'https://x.com/VisionaryAI_Demo', status: 'Active' },
    { id: 'tc_2', name: 'Momentum', url: 'https://www.tiktok.com/@MomentumGrowthDemo', status: 'Active' },
    { id: 'tc_3', name: 'Polmerone', url: 'https://www.instagram.com/polmerone', status: 'Active' },
    { id: 'tc_4', name: 'InnovateCorp', url: 'https://www.innovatecorp-demo.com', status: 'Active' },
    { id: 'tc_5', name: 'Quantum', url: 'https://www.quantum-analytics-demo.com', status: 'Active' },
    { id: 'tc_6', name: 'ApexGlobal', url: 'https://www.apexglobal-solutions.com', status: 'Active' },
    { id: 'tc_7', name: 'Stellar', url: 'https://stellar.org', status: 'Active' },
    { id: 'tc_8', name: 'NEXUS', url: 'https://www.facebook.com/NexusTechnologiesDemo', status: 'Active' },
    { id: 'tc_9', name: 'MixAtacadoVarejo', url: 'https://www.instagram.com/mix_atacado_varejo', status: 'Active' },
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

        // 1. Sync Users
        const userCountRequest = userStore.count();
        userCountRequest.onsuccess = () => {
            const backupUsers = getUsersFromBackup();
            
            if (userCountRequest.result === 0 || (backupUsers.length > 0 && userCountRequest.result < backupUsers.length)) {
                if (backupUsers.length > 0) {
                    backupUsers.forEach(user => userStore.put(user));
                    console.log("Database restored from persistent local backup.");
                } else {
                    initialUsers.forEach(user => userStore.add(user));
                    saveUsersToBackup(initialUsers);
                    console.log("Database seeded with initial users.");
                }
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
                     const backup = getUsersFromBackup();
                     // If DB empty but backup exists, return backup (and implicitly UI should trigger a restore later)
                     if (backup.length > 0) resolve(backup);
                     else resolve(users);
                } else {
                    // Keep backup synced on every read to ensure latest state is in LocalStorage
                    saveUsersToBackup(users);
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
