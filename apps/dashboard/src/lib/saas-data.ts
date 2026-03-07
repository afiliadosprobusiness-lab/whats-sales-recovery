export type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
};

export type ChatMessage = {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  timestamp: string;
};

export type CrmConversation = {
  id: string;
  customerName: string;
  phone: string;
  leadScore: number;
  state: "ready_to_buy" | "reactivatable" | "abandoned" | "active";
  lastActivity: string;
  lastMessage: string;
  messages: ChatMessage[];
};

export type RecoveryItem = {
  id: string;
  phone: string;
  lastMessage: string;
  leadScore: number;
  recommendedAction: string;
};

export type AnalyticsSeriesPoint = {
  label: string;
  value: number;
};

export type AnalyticsDataset = {
  recoveredRevenue: AnalyticsSeriesPoint[];
  followupPerformance: AnalyticsSeriesPoint[];
  leadConversionRate: AnalyticsSeriesPoint[];
};

const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Recovered revenue",
    value: "S/ 14,820",
    delta: "+18.4% vs last week"
  },
  {
    label: "Active conversations",
    value: "126",
    delta: "+12 active today"
  },
  {
    label: "Ready-to-buy customers",
    value: "38",
    delta: "6 new high-intent leads"
  },
  {
    label: "Total leads",
    value: "482",
    delta: "+41 this month"
  }
];

const conversations: CrmConversation[] = [
  {
    id: "conv-1",
    customerName: "Carla Mendez",
    phone: "+51 987 221 344",
    leadScore: 91,
    state: "ready_to_buy",
    lastActivity: "2 min ago",
    lastMessage: "Si pagamos hoy, llega manana?",
    messages: [
      {
        id: "m-1",
        direction: "inbound",
        body: "Hola, tienen stock del modelo negro?",
        timestamp: "10:02"
      },
      {
        id: "m-2",
        direction: "outbound",
        body: "Si, tenemos stock y envio el mismo dia.",
        timestamp: "10:03"
      },
      {
        id: "m-3",
        direction: "inbound",
        body: "Si pagamos hoy, llega manana?",
        timestamp: "10:08"
      }
    ]
  },
  {
    id: "conv-2",
    customerName: "Luis Ramos",
    phone: "+51 934 110 809",
    leadScore: 74,
    state: "reactivatable",
    lastActivity: "31 min ago",
    lastMessage: "Quedo atento, me avisas si hay promo.",
    messages: [
      {
        id: "m-4",
        direction: "inbound",
        body: "Quedo atento, me avisas si hay promo.",
        timestamp: "09:44"
      },
      {
        id: "m-5",
        direction: "outbound",
        body: "Te comparto una oferta si confirmas hoy.",
        timestamp: "09:45"
      }
    ]
  },
  {
    id: "conv-3",
    customerName: "Mia Salazar",
    phone: "+51 955 004 997",
    leadScore: 53,
    state: "abandoned",
    lastActivity: "1 h ago",
    lastMessage: "Gracias, lo reviso.",
    messages: [
      {
        id: "m-6",
        direction: "inbound",
        body: "Gracias, lo reviso.",
        timestamp: "08:59"
      },
      {
        id: "m-7",
        direction: "outbound",
        body: "Perfecto, te escribo mas tarde para ayudarte.",
        timestamp: "09:01"
      }
    ]
  }
];

const recoveryData: {
  abandonedConversations: RecoveryItem[];
  reactivatableCustomers: RecoveryItem[];
  readyToCloseLeads: RecoveryItem[];
} = {
  abandonedConversations: [
    {
      id: "ab-1",
      phone: "+51 977 140 220",
      lastMessage: "Me interesa, pero ahora no puedo.",
      leadScore: 69,
      recommendedAction: "Send urgency follow-up"
    },
    {
      id: "ab-2",
      phone: "+51 932 422 191",
      lastMessage: "Avisame cuando llegue el color azul.",
      leadScore: 62,
      recommendedAction: "Offer stock alert + reminder"
    }
  ],
  reactivatableCustomers: [
    {
      id: "re-1",
      phone: "+51 944 623 511",
      lastMessage: "Vuelvo en la noche",
      leadScore: 78,
      recommendedAction: "Send personalized comeback message"
    }
  ],
  readyToCloseLeads: [
    {
      id: "rc-1",
      phone: "+51 900 550 332",
      lastMessage: "Solo necesito confirmar el metodo de pago",
      leadScore: 93,
      recommendedAction: "Send checkout link now"
    },
    {
      id: "rc-2",
      phone: "+51 980 114 333",
      lastMessage: "Si me incluye delivery, cierro hoy",
      leadScore: 89,
      recommendedAction: "Apply delivery incentive"
    }
  ]
};

const analytics: AnalyticsDataset = {
  recoveredRevenue: [
    { label: "Mon", value: 1800 },
    { label: "Tue", value: 2200 },
    { label: "Wed", value: 1950 },
    { label: "Thu", value: 2480 },
    { label: "Fri", value: 3010 },
    { label: "Sat", value: 3380 }
  ],
  followupPerformance: [
    { label: "Step 1", value: 84 },
    { label: "Step 2", value: 57 },
    { label: "Step 3", value: 39 },
    { label: "Step 4", value: 22 }
  ],
  leadConversionRate: [
    { label: "Week 1", value: 14 },
    { label: "Week 2", value: 17 },
    { label: "Week 3", value: 19 },
    { label: "Week 4", value: 24 }
  ]
};

export async function getDashboardMetrics(): Promise<DashboardMetric[]> {
  return dashboardMetrics;
}

export async function getConversationsCRM(): Promise<CrmConversation[]> {
  return conversations;
}

export async function getRecoveryBuckets(): Promise<typeof recoveryData> {
  return recoveryData;
}

export async function getAnalyticsData(): Promise<AnalyticsDataset> {
  return analytics;
}
