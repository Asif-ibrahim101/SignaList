
declare global {
    type SignInFormData = {
        email: string;
        password: string;
    };

    type SignUpFormData = {
        fullName: string;
        email: string;
        password: string;
        country: string;
        investmentGoals: string;
        riskTolerance: string;
        preferredIndustry: string;
    };

    type CountrySelectProps = {
        name: string;
        label: string;
        control: Control;
        error?: FieldError;
        required?: boolean;
    };

    type FormInputProps = {
        name: string;
        label: string;
        placeholder: string;
        type?: string;
        register: UseFormRegister;
        error?: FieldError;
        validation?: RegisterOptions;
        disabled?: boolean;
        value?: string;
    };

    type Option = {
        value: string;
        label: string;
    };

    type SelectFieldProps = {
        name: string;
        label: string;
        placeholder: string;
        options: readonly Option[];
        control: Control;
        error?: FieldError;
        required?: boolean;
    };

    type FooterLinkProps = {
        text: string;
        linkText: string;
        href: string;
    };

    type SearchCommandProps = {
        renderAs?: 'button' | 'text';
        label?: string;
        initialStocks: StockWithWatchlistStatus[];
    };

    type WelcomeEmailData = {
        email: string;
        name: string;
        intro: string;
    };

    type User = {
        id: string;
        name: string;
        email: string;
    };

    type Stock = {
        symbol: string;
        name: string;
        exchange: string;
        type: string;
    };

    type StockWithWatchlistStatus = Stock & {
        isInWatchlist: boolean;
    };

    type FinnhubSearchResult = {
        symbol: string;
        description: string;
        displaySymbol?: string;
        type: string;
    };

    type FinnhubSearchResponse = {
        count: number;
        result: FinnhubSearchResult[];
    };

    type StockDetailsPageProps = {
        params: Promise<{
            symbol: string;
        }>;
    };

    type WatchlistButtonProps = {
        symbol: string;
        company: string;
        isInWatchlist: boolean;
        showTrashIcon?: boolean;
        type?: 'button' | 'icon';
        onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
    };

    type QuoteData = {
        c?: number;
        dp?: number;
    };

    type ProfileData = {
        name?: string;
        marketCapitalization?: number;
    };

    type FinancialsData = {
        metric?: { [key: string]: number };
    };

    type SelectedStock = {
        symbol: string;
        company: string;
        currentPrice?: number;
    };

    type WatchlistTableProps = {
        watchlist: StockWithData[];
    };

    type StockWithData = {
        userId: string;
        symbol: string;
        company: string;
        addedAt: Date;
        currentPrice?: number;
        changePercent?: number;
        priceFormatted?: string;
        changeFormatted?: string;
        marketCap?: string;
        peRatio?: string;
    };

    type AlertsListProps = {
        alertData: Alert[] | undefined;
    };

    type MarketNewsArticle = {
        id: number;
        headline: string;
        summary: string;
        source: string;
        url: string;
        datetime: number;
        category: string;
        related: string;
        image?: string;
    };

    type WatchlistNewsProps = {
        news?: MarketNewsArticle[];
    };

    type SearchCommandProps = {
        open?: boolean;
        setOpen?: (open: boolean) => void;
        renderAs?: 'button' | 'text';
        buttonLabel?: string;
        buttonVariant?: 'primary' | 'secondary';
        className?: string;
    };

    type AlertData = {
        symbol: string;
        company: string;
        alertName: string;
        alertType: 'upper' | 'lower';
        threshold: string;
    };

    type AlertModalProps = {
        alertId?: string;
        alertData?: AlertData;
        action?: string;
        open: boolean;
        setOpen: (open: boolean) => void;
    };

    type RawNewsArticle = {
        id: number;
        headline?: string;
        summary?: string;
        source?: string;
        url?: string;
        datetime?: number;
        image?: string;
        category?: string;
        related?: string;
    };

    type Alert = {
        id: string;
        symbol: string;
        company: string;
        alertName: string;
        currentPrice: number;
        alertType: 'upper' | 'lower';
        threshold: number;
        changePercent?: number;
    };

    type SignalSource = 'hybrid' | 'finnhub' | 'alpha_vantage' | 'synthetic';

    type SignalFactorContribution = {
        name: string;
        label: string;
        score: number;
        weight: number;
        contribution: number;
        direction: 'positive' | 'negative' | 'neutral';
    };

    type SignalSnapshotView = {
        symbol: string;
        score: number;
        scoreDelta: number;
        confidence: number;
        price: number;
        changePercent: number;
        volume: number;
        sentiment: number;
        volumeZScore: number;
        source: SignalSource;
        narrative: string;
        factors: SignalFactorContribution[];
        updatedAt: string;
        lastMode: 'intraday' | 'batch';
    };

    type SignalHistoryPoint = {
        timestamp: string;
        score: number;
        scoreDelta: number;
        changePercent: number;
        sentiment: number;
    };

    type AlertMetricField =
        | 'score'
        | 'scoreDelta'
        | 'sentiment'
        | 'volumeZScore'
        | 'confidence'
        | 'changePercent';

    type AlertMetricOperator = '>' | '>=' | '<' | '<=' | '==';

    type CompositeAlertCondition = {
        field: AlertMetricField;
        operator: AlertMetricOperator;
        value: number;
    };

    type CompositeAlertRuleView = {
        id: string;
        name: string;
        symbols: string[];
        conditions: CompositeAlertCondition[];
        logic: 'AND' | 'OR';
        cooldownMinutes: number;
        channel: 'in_app';
        isActive: boolean;
        lastTriggeredAt: string | null;
        createdAt: string | null;
        updatedAt: string | null;
    };

    type AlertTriggerEventView = {
        id: string;
        ruleId: string;
        ruleName: string;
        symbol: string;
        score: number;
        scoreDelta: number;
        sentiment: number;
        volumeZScore: number;
        confidence: number;
        changePercent: number;
        triggeredAt: string;
    };
}

declare module 'react-select-country-list' {
    type CountryOption = {
        label: string;
        value: string;
    };

    type CountryListInstance = {
        getData: () => CountryOption[];
    };

    export default function countryList(): CountryListInstance;
}

export {};
