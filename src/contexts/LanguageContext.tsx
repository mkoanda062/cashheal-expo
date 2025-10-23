// src/contexts/LanguageContext.tsx

import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import storage from "../utils/persistentStorage";

export type Language = "fr" | "en" | "es" | "pt" | "zh" | "ja";

type LanguageCtx = {
  language: Language;
  setLanguage: (l: Language) => Promise<void>;
  t: (key: string) => string;
};

const STORAGE_KEY = "app_language";

const LANGUAGE_NAMES: Record<Language, string> = {
  fr: "Français",
  en: "English", 
  es: "Español",
  pt: "Português",
  zh: "中文",
  ja: "日本語",
};

const LANGUAGE_FLAGS: Record<Language, string> = {
  fr: "🇫🇷",
  en: "🇺🇸",
  es: "🇪🇸", 
  pt: "🇵🇹",
  zh: "🇨🇳",
  ja: "🇯🇵",
};

const SUPPORTED_LANGUAGES: Language[] = ["fr", "en", "es", "pt", "zh", "ja"];

// Traductions
const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    "nav.home": "Accueil",
    "nav.advisor": "Conseiller",
    "nav.stats": "Statistiques", 
    "nav.settings": "Paramètres",
    
    // Home Screen
    "home.title": "CashHeal",
    "home.subtitle": "Gérez vos finances intelligemment",
    "home.balance": "Solde",
    "home.available": "Disponible",
    "home.spent": "Dépensé",
    "home.budget": "Budget",
    "home.add_expense": "Ajouter une dépense",
    "home.categories": "Catégories",
    "home.food": "Nourriture",
    "home.shopping": "Shopping",
    "home.leisure": "Loisirs",
    
    // Budget Advisor
    "advisor.title": "Conseiller Budgétaire",
    "advisor.subtitle": "Créons votre plan financier personnalisé",
    "advisor.monthly_budget": "Quel est votre budget mensuel ?",
    "advisor.rent": "Quel est votre loyer mensuel ?",
    "advisor.daily_spending": "Combien voulez-vous dépenser par jour ?",
    "advisor.weekly_spending": "Combien voulez-vous dépenser par semaine ?",
    "advisor.biweekly_spending": "Combien voulez-vous dépenser toutes les 2 semaines ?",
    "advisor.monthly_spending": "Combien voulez-vous dépenser par mois ?",
    "advisor.savings_goal": "Quel est votre objectif d'épargne ?",
    "advisor.savings_30": "Sécurité maximale (30% d'épargne)",
    "advisor.savings_balanced": "Juste milieu (15% d'épargne)",
    "advisor.savings_invest": "Investissement (5% d'épargne)",
    "advisor.calculate": "Calculer mon plan",
    "advisor.save": "Sauvegarder",
    "advisor.continue": "Continuer",
    "advisor.back": "Retour",
    "advisor.result_title": "Votre plan budgétaire",
    "advisor.fixed_charges": "Charges fixes",
    "advisor.available_spending": "Disponible pour dépenser",
    "advisor.daily_budget": "Budget quotidien",
    "advisor.weekly_budget": "Budget hebdomadaire",
    "advisor.biweekly_budget": "Budget bi-hebdomadaire",
    
    // Settings
    "settings.title": "Paramètres",
    "settings.currency": "Devise",
    "settings.language": "Langue",
    "settings.country": "Pays",
    "settings.notifications": "Notifications",
    "settings.biometric": "Authentification biométrique",
    "settings.dark_mode": "Mode sombre",
    "settings.personal_info": "Informations personnelles",
    "settings.logout": "Se déconnecter",
    
    // Common
    "common.save": "Sauvegarder",
    "common.cancel": "Annuler",
    "common.confirm": "Confirmer",
    "common.error": "Erreur",
    "common.success": "Succès",
    "common.loading": "Chargement...",
  },
  
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.advisor": "Advisor",
    "nav.stats": "Statistics",
    "nav.settings": "Settings",
    
    // Home Screen
    "home.title": "CashHeal",
    "home.subtitle": "Manage your finances smartly",
    "home.balance": "Balance",
    "home.available": "Available",
    "home.spent": "Spent",
    "home.budget": "Budget",
    "home.add_expense": "Add expense",
    "home.categories": "Categories",
    "home.food": "Food",
    "home.shopping": "Shopping",
    "home.leisure": "Leisure",
    
    // Budget Advisor
    "advisor.title": "Budget Advisor",
    "advisor.subtitle": "Let's create your personalized financial plan",
    "advisor.monthly_budget": "What is your monthly budget?",
    "advisor.rent": "What is your monthly rent?",
    "advisor.daily_spending": "How much do you want to spend per day?",
    "advisor.weekly_spending": "How much do you want to spend per week?",
    "advisor.biweekly_spending": "How much do you want to spend every 2 weeks?",
    "advisor.monthly_spending": "How much do you want to spend per month?",
    "advisor.savings_goal": "What is your savings goal?",
    "advisor.savings_30": "Maximum security (30% savings)",
    "advisor.savings_balanced": "Balanced (15% savings)",
    "advisor.savings_invest": "Investment (5% savings)",
    "advisor.calculate": "Calculate my plan",
    "advisor.save": "Save",
    "advisor.continue": "Continue",
    "advisor.back": "Back",
    "advisor.result_title": "Your budget plan",
    "advisor.fixed_charges": "Fixed charges",
    "advisor.available_spending": "Available for spending",
    "advisor.daily_budget": "Daily budget",
    "advisor.weekly_budget": "Weekly budget",
    "advisor.biweekly_budget": "Bi-weekly budget",
    
    // Settings
    "settings.title": "Settings",
    "settings.currency": "Currency",
    "settings.language": "Language",
    "settings.country": "Country",
    "settings.notifications": "Notifications",
    "settings.biometric": "Biometric authentication",
    "settings.dark_mode": "Dark mode",
    "settings.personal_info": "Personal information",
    "settings.logout": "Logout",
    
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.error": "Error",
    "common.success": "Success",
    "common.loading": "Loading...",
  },
  
  es: {
    // Navigation
    "nav.home": "Inicio",
    "nav.advisor": "Asesor",
    "nav.stats": "Estadísticas",
    "nav.settings": "Configuración",
    
    // Home Screen
    "home.title": "CashHeal",
    "home.subtitle": "Gestiona tus finanzas inteligentemente",
    "home.balance": "Saldo",
    "home.available": "Disponible",
    "home.spent": "Gastado",
    "home.budget": "Presupuesto",
    "home.add_expense": "Agregar gasto",
    "home.categories": "Categorías",
    "home.food": "Comida",
    "home.shopping": "Compras",
    "home.leisure": "Ocio",
    
    // Budget Advisor
    "advisor.title": "Asesor Presupuestario",
    "advisor.subtitle": "Creemos tu plan financiero personalizado",
    "advisor.monthly_budget": "¿Cuál es tu presupuesto mensual?",
    "advisor.rent": "¿Cuál es tu alquiler mensual?",
    "advisor.daily_spending": "¿Cuánto quieres gastar por día?",
    "advisor.weekly_spending": "¿Cuánto quieres gastar por semana?",
    "advisor.biweekly_spending": "¿Cuánto quieres gastar cada 2 semanas?",
    "advisor.monthly_spending": "¿Cuánto quieres gastar por mes?",
    "advisor.savings_goal": "¿Cuál es tu objetivo de ahorro?",
    "advisor.savings_30": "Máxima seguridad (30% ahorro)",
    "advisor.savings_balanced": "Equilibrado (15% ahorro)",
    "advisor.savings_invest": "Inversión (5% ahorro)",
    "advisor.calculate": "Calcular mi plan",
    "advisor.save": "Guardar",
    "advisor.continue": "Continuar",
    "advisor.back": "Atrás",
    "advisor.result_title": "Tu plan presupuestario",
    "advisor.fixed_charges": "Cargos fijos",
    "advisor.available_spending": "Disponible para gastar",
    "advisor.daily_budget": "Presupuesto diario",
    "advisor.weekly_budget": "Presupuesto semanal",
    "advisor.biweekly_budget": "Presupuesto quincenal",
    
    // Settings
    "settings.title": "Configuración",
    "settings.currency": "Moneda",
    "settings.language": "Idioma",
    "settings.country": "País",
    "settings.notifications": "Notificaciones",
    "settings.biometric": "Autenticación biométrica",
    "settings.dark_mode": "Modo oscuro",
    "settings.personal_info": "Información personal",
    "settings.logout": "Cerrar sesión",
    
    // Common
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.confirm": "Confirmar",
    "common.error": "Error",
    "common.success": "Éxito",
    "common.loading": "Cargando...",
  },
  
  pt: {
    // Navigation
    "nav.home": "Início",
    "nav.advisor": "Consultor",
    "nav.stats": "Estatísticas",
    "nav.settings": "Configurações",
    
    // Home Screen
    "home.title": "CashHeal",
    "home.subtitle": "Gerencie suas finanças inteligentemente",
    "home.balance": "Saldo",
    "home.available": "Disponível",
    "home.spent": "Gasto",
    "home.budget": "Orçamento",
    "home.add_expense": "Adicionar despesa",
    "home.categories": "Categorias",
    "home.food": "Comida",
    "home.shopping": "Compras",
    "home.leisure": "Lazer",
    
    // Budget Advisor
    "advisor.title": "Consultor Orçamentário",
    "advisor.subtitle": "Vamos criar seu plano financeiro personalizado",
    "advisor.monthly_budget": "Qual é seu orçamento mensal?",
    "advisor.rent": "Qual é seu aluguel mensal?",
    "advisor.daily_spending": "Quanto você quer gastar por dia?",
    "advisor.weekly_spending": "Quanto você quer gastar por semana?",
    "advisor.biweekly_spending": "Quanto você quer gastar a cada 2 semanas?",
    "advisor.monthly_spending": "Quanto você quer gastar por mês?",
    "advisor.savings_goal": "Qual é seu objetivo de poupança?",
    "advisor.savings_30": "Máxima segurança (30% poupança)",
    "advisor.savings_balanced": "Equilibrado (15% poupança)",
    "advisor.savings_invest": "Investimento (5% poupança)",
    "advisor.calculate": "Calcular meu plano",
    "advisor.save": "Salvar",
    "advisor.continue": "Continuar",
    "advisor.back": "Voltar",
    "advisor.result_title": "Seu plano orçamentário",
    "advisor.fixed_charges": "Custos fixos",
    "advisor.available_spending": "Disponível para gastar",
    "advisor.daily_budget": "Orçamento diário",
    "advisor.weekly_budget": "Orçamento semanal",
    "advisor.biweekly_budget": "Orçamento quinzenal",
    
    // Settings
    "settings.title": "Configurações",
    "settings.currency": "Moeda",
    "settings.language": "Idioma",
    "settings.country": "País",
    "settings.notifications": "Notificações",
    "settings.biometric": "Autenticação biométrica",
    "settings.dark_mode": "Modo escuro",
    "settings.personal_info": "Informações pessoais",
    "settings.logout": "Sair",
    
    // Common
    "common.save": "Salvar",
    "common.cancel": "Cancelar",
    "common.confirm": "Confirmar",
    "common.error": "Erro",
    "common.success": "Sucesso",
    "common.loading": "Carregando...",
  },
  
  zh: {
    // Navigation
    "nav.home": "首页",
    "nav.advisor": "顾问",
    "nav.stats": "统计",
    "nav.settings": "设置",
    
    // Home Screen
    "home.title": "CashHeal",
    "home.subtitle": "智能管理您的财务",
    "home.balance": "余额",
    "home.available": "可用",
    "home.spent": "已花费",
    "home.budget": "预算",
    "home.add_expense": "添加支出",
    "home.categories": "类别",
    "home.food": "食物",
    "home.shopping": "购物",
    "home.leisure": "休闲",
    
    // Budget Advisor
    "advisor.title": "预算顾问",
    "advisor.subtitle": "让我们创建您的个性化财务计划",
    "advisor.monthly_budget": "您的月预算是多少？",
    "advisor.rent": "您的月租金是多少？",
    "advisor.daily_spending": "您每天想花多少钱？",
    "advisor.weekly_spending": "您每周想花多少钱？",
    "advisor.biweekly_spending": "您每两周想花多少钱？",
    "advisor.monthly_spending": "您每月想花多少钱？",
    "advisor.savings_goal": "您的储蓄目标是什么？",
    "advisor.savings_30": "最大安全性（30%储蓄）",
    "advisor.savings_balanced": "平衡（15%储蓄）",
    "advisor.savings_invest": "投资（5%储蓄）",
    "advisor.calculate": "计算我的计划",
    "advisor.save": "保存",
    "advisor.continue": "继续",
    "advisor.back": "返回",
    "advisor.result_title": "您的预算计划",
    "advisor.fixed_charges": "固定费用",
    "advisor.available_spending": "可用于支出",
    "advisor.daily_budget": "每日预算",
    "advisor.weekly_budget": "每周预算",
    "advisor.biweekly_budget": "双周预算",
    
    // Settings
    "settings.title": "设置",
    "settings.currency": "货币",
    "settings.language": "语言",
    "settings.country": "国家",
    "settings.notifications": "通知",
    "settings.biometric": "生物识别认证",
    "settings.dark_mode": "深色模式",
    "settings.personal_info": "个人信息",
    "settings.logout": "退出登录",
    
    // Common
    "common.save": "保存",
    "common.cancel": "取消",
    "common.confirm": "确认",
    "common.error": "错误",
    "common.success": "成功",
    "common.loading": "加载中...",
  },
  
  ja: {
    // Navigation
    "nav.home": "ホーム",
    "nav.advisor": "アドバイザー",
    "nav.stats": "統計",
    "nav.settings": "設定",
    
    // Home Screen
    "home.title": "CashHeal",
    "home.subtitle": "スマートに財務を管理",
    "home.balance": "残高",
    "home.available": "利用可能",
    "home.spent": "支出",
    "home.budget": "予算",
    "home.add_expense": "支出を追加",
    "home.categories": "カテゴリ",
    "home.food": "食事",
    "home.shopping": "ショッピング",
    "home.leisure": "レジャー",
    
    // Budget Advisor
    "advisor.title": "予算アドバイザー",
    "advisor.subtitle": "あなたの個人的な財務計画を作成しましょう",
    "advisor.monthly_budget": "月間予算はいくらですか？",
    "advisor.rent": "月間家賃はいくらですか？",
    "advisor.daily_spending": "1日にいくら使いたいですか？",
    "advisor.weekly_spending": "週にいくら使いたいですか？",
    "advisor.biweekly_spending": "2週間ごとにいくら使いたいですか？",
    "advisor.monthly_spending": "月にいくら使いたいですか？",
    "advisor.savings_goal": "貯蓄目標は何ですか？",
    "advisor.savings_30": "最大セキュリティ（30%貯蓄）",
    "advisor.savings_balanced": "バランス（15%貯蓄）",
    "advisor.savings_invest": "投資（5%貯蓄）",
    "advisor.calculate": "私の計画を計算",
    "advisor.save": "保存",
    "advisor.continue": "続行",
    "advisor.back": "戻る",
    "advisor.result_title": "あなたの予算計画",
    "advisor.fixed_charges": "固定費",
    "advisor.available_spending": "支出可能額",
    "advisor.daily_budget": "日次予算",
    "advisor.weekly_budget": "週次予算",
    "advisor.biweekly_budget": "隔週予算",
    
    // Settings
    "settings.title": "設定",
    "settings.currency": "通貨",
    "settings.language": "言語",
    "settings.country": "国",
    "settings.notifications": "通知",
    "settings.biometric": "生体認証",
    "settings.dark_mode": "ダークモード",
    "settings.personal_info": "個人情報",
    "settings.logout": "ログアウト",
    
    // Common
    "common.save": "保存",
    "common.cancel": "キャンセル",
    "common.confirm": "確認",
    "common.error": "エラー",
    "common.success": "成功",
    "common.loading": "読み込み中...",
  },
};

const LanguageContext = createContext<LanguageCtx | null>(null);

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("fr");

  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED_LANGUAGES.includes(stored as Language)) {
          setLanguageState(stored as Language);
        }
      } catch (error) {
        console.warn("Impossible de charger la langue sauvegardée", error);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      await storage.setItem(STORAGE_KEY, nextLanguage);
    } catch (error) {
      console.warn("Impossible d'enregistrer la langue", error);
    }
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key] || key;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export { LanguageProvider, SUPPORTED_LANGUAGES, LANGUAGE_NAMES, LANGUAGE_FLAGS };
