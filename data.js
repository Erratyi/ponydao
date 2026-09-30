export const owner = {
  name: '聂梦松',
  username: 'mason',
  email: 'mason@example.com',
};

// Public, client-side credentials for presentation only; not real authentication.
export function authenticateDemoUser(identity, password) {
  return (identity.trim() === owner.username || identity.trim() === owner.email)
    && password === 'PONYdemo2026!';
}

const demoSessionKey = 'ponydao-demo-user';

export function isDemoSignedIn(storage) {
  return storage.getItem(demoSessionKey) === owner.username;
}

export function startDemoSession(storage) {
  storage.setItem(demoSessionKey, owner.username);
}

export function endDemoSession(storage) {
  storage.removeItem(demoSessionKey);
}

// Only the facts supplied for this presentation are stored here.
export const islands = [
  {
    id: 'xiaoma',
    name: '小马有数',
    logo: './assets/xiaoma.png',
    product: '行为数据采集电子标签',
    projects: ['艾莱依2026项目'],
    theme: 'ink',
  },
  {
    id: 'laima',
    name: '莱马智控',
    logo: './assets/laima.png',
    product: 'RFID防盗网关',
    projects: ['WG美国市场推广'],
    theme: 'blue',
  },
  {
    id: 'anjun',
    name: '安骏坤途',
    logo: './assets/anjun.png',
    product: 'PONYGOGO行李箱',
    projects: ['机场数码零售地推', 'Kickstarter 众筹', '广交会推广'],
    theme: 'gold',
  },
];

export const islandById = Object.fromEntries(islands.map((island) => [island.id, island]));
