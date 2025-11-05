import { useState } from 'react';
import { Users, TrendingUp, DollarSign, Briefcase, Award, Building, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';

interface PortfolioHolding {
  symbol: string;
  companyName: string;
  shares?: number;
  value?: number;
  percentOfPortfolio: number;
}

interface InvestorProfile {
  id: string;
  name: string;
  title: string;
  description: string;
  strategy: string;
  totalValue: string;
  holdings: PortfolioHolding[];
  performance: string;
  lastUpdated: string;
}

interface CongressMember {
  id: string;
  name: string;
  party: 'R' | 'D' | 'I';
  chamber: 'Senate' | 'House';
  state: string;
  totalTrades: number;
  holdings: PortfolioHolding[];
  lastUpdated: string;
}

const FAMOUS_INVESTORS: InvestorProfile[] = [
  {
    id: 'buffett',
    name: 'Warren Buffett',
    title: 'CEO, Berkshire Hathaway',
    description: 'Value investing legend focusing on long-term quality businesses',
    strategy: 'Value investing with a focus on strong fundamentals, competitive moats, and long-term holdings',
    totalValue: '$364B',
    performance: '+19.8% YTD',
    lastUpdated: 'Q4 2024',
    holdings: [
      { symbol: 'AAPL', companyName: 'Apple Inc.', percentOfPortfolio: 50.2 },
      { symbol: 'BAC', companyName: 'Bank of America', percentOfPortfolio: 11.8 },
      { symbol: 'AXP', companyName: 'American Express', percentOfPortfolio: 10.5 },
      { symbol: 'KO', companyName: 'Coca-Cola', percentOfPortfolio: 9.2 },
      { symbol: 'CVX', companyName: 'Chevron', percentOfPortfolio: 8.4 },
      { symbol: 'OXY', companyName: 'Occidental Petroleum', percentOfPortfolio: 9.9 },
    ],
  },
  {
    id: 'ackman',
    name: 'Bill Ackman',
    title: 'CEO, Pershing Square Capital',
    description: 'Activist investor known for concentrated positions in high-quality businesses',
    strategy: 'Concentrated portfolio of 8-12 high-conviction positions with activist approach',
    totalValue: '$10.5B',
    performance: '+24.3% YTD',
    lastUpdated: 'Q4 2024',
    holdings: [
      { symbol: 'CMG', companyName: 'Chipotle Mexican Grill', percentOfPortfolio: 28.5 },
      { symbol: 'HLT', companyName: 'Hilton Worldwide', percentOfPortfolio: 18.2 },
      { symbol: 'LOW', companyName: "Lowe's", percentOfPortfolio: 16.4 },
      { symbol: 'UNH', companyName: 'UnitedHealth Group', percentOfPortfolio: 14.8 },
      { symbol: 'QSR', companyName: 'Restaurant Brands', percentOfPortfolio: 12.1 },
      { symbol: 'CP', companyName: 'Canadian Pacific Railway', percentOfPortfolio: 10.0 },
    ],
  },
  {
    id: 'burry',
    name: 'Michael Burry',
    title: 'Founder, Scion Asset Management',
    description: 'Contrarian investor famous for predicting the 2008 financial crisis',
    strategy: 'Deep value, contrarian bets with intensive research and short positions',
    totalValue: '$140M',
    performance: '+12.1% YTD',
    lastUpdated: 'Q3 2024',
    holdings: [
      { symbol: 'BABA', companyName: 'Alibaba Group', percentOfPortfolio: 24.5 },
      { symbol: 'JD', companyName: 'JD.com', percentOfPortfolio: 20.2 },
      { symbol: 'BIDU', companyName: 'Baidu', percentOfPortfolio: 18.8 },
      { symbol: 'BP', companyName: 'BP plc', percentOfPortfolio: 15.4 },
      { symbol: 'CVS', companyName: 'CVS Health', percentOfPortfolio: 12.6 },
      { symbol: 'GOOG', companyName: 'Alphabet', percentOfPortfolio: 8.5 },
    ],
  },
  {
    id: 'wood',
    name: 'Cathie Wood',
    title: 'CEO, ARK Invest',
    description: 'Growth investor focused on disruptive innovation and technology',
    strategy: 'Thematic investing in disruptive innovation across genomics, AI, fintech, and robotics',
    totalValue: '$6.8B',
    performance: '+42.7% YTD',
    lastUpdated: 'Q4 2024',
    holdings: [
      { symbol: 'TSLA', companyName: 'Tesla', percentOfPortfolio: 18.5 },
      { symbol: 'COIN', companyName: 'Coinbase', percentOfPortfolio: 16.2 },
      { symbol: 'ROKU', companyName: 'Roku', percentOfPortfolio: 14.8 },
      { symbol: 'RBLX', companyName: 'Roblox', percentOfPortfolio: 13.4 },
      { symbol: 'PATH', companyName: 'UiPath', percentOfPortfolio: 12.1 },
      { symbol: 'CRSP', companyName: 'CRISPR Therapeutics', percentOfPortfolio: 10.6 },
    ],
  },
  {
    id: 'dalio',
    name: 'Ray Dalio',
    title: 'Founder, Bridgewater Associates',
    description: 'Macro investor with all-weather portfolio strategy',
    strategy: 'Global macro strategy with systematic risk parity approach',
    totalValue: '$126B',
    performance: '+11.4% YTD',
    lastUpdated: 'Q4 2024',
    holdings: [
      { symbol: 'SPY', companyName: 'SPDR S&P 500 ETF', percentOfPortfolio: 22.4 },
      { symbol: 'VWO', companyName: 'Vanguard Emerging Markets', percentOfPortfolio: 18.6 },
      { symbol: 'PG', companyName: 'Procter & Gamble', percentOfPortfolio: 16.2 },
      { symbol: 'JNJ', companyName: 'Johnson & Johnson', percentOfPortfolio: 14.8 },
      { symbol: 'KO', companyName: 'Coca-Cola', percentOfPortfolio: 13.4 },
      { symbol: 'WMT', companyName: 'Walmart', percentOfPortfolio: 14.6 },
    ],
  },
];

const CONGRESS_MEMBERS: CongressMember[] = [
  {
    id: 'pelosi',
    name: 'Nancy Pelosi',
    party: 'D',
    chamber: 'House',
    state: 'CA',
    totalTrades: 47,
    lastUpdated: 'Dec 2024',
    holdings: [
      { symbol: 'NVDA', companyName: 'NVIDIA', percentOfPortfolio: 22.4 },
      { symbol: 'MSFT', companyName: 'Microsoft', percentOfPortfolio: 19.2 },
      { symbol: 'GOOGL', companyName: 'Alphabet', percentOfPortfolio: 17.5 },
      { symbol: 'AAPL', companyName: 'Apple', percentOfPortfolio: 15.8 },
      { symbol: 'CRM', companyName: 'Salesforce', percentOfPortfolio: 13.6 },
      { symbol: 'TSLA', companyName: 'Tesla', percentOfPortfolio: 11.5 },
    ],
  },
  {
    id: 'tuberville',
    name: 'Tommy Tuberville',
    party: 'R',
    chamber: 'Senate',
    state: 'AL',
    totalTrades: 132,
    lastUpdated: 'Nov 2024',
    holdings: [
      { symbol: 'AAPL', companyName: 'Apple', percentOfPortfolio: 24.8 },
      { symbol: 'MSFT', companyName: 'Microsoft', percentOfPortfolio: 20.5 },
      { symbol: 'GOOGL', companyName: 'Alphabet', percentOfPortfolio: 18.2 },
      { symbol: 'BA', companyName: 'Boeing', percentOfPortfolio: 14.6 },
      { symbol: 'F', companyName: 'Ford', percentOfPortfolio: 12.3 },
      { symbol: 'XOM', companyName: 'Exxon Mobil', percentOfPortfolio: 9.6 },
    ],
  },
  {
    id: 'hern',
    name: 'Kevin Hern',
    party: 'R',
    chamber: 'House',
    state: 'OK',
    totalTrades: 89,
    lastUpdated: 'Dec 2024',
    holdings: [
      { symbol: 'META', companyName: 'Meta Platforms', percentOfPortfolio: 21.8 },
      { symbol: 'AMZN', companyName: 'Amazon', percentOfPortfolio: 19.6 },
      { symbol: 'TSLA', companyName: 'Tesla', percentOfPortfolio: 17.4 },
      { symbol: 'NVDA', companyName: 'NVIDIA', percentOfPortfolio: 15.8 },
      { symbol: 'V', companyName: 'Visa', percentOfPortfolio: 13.2 },
      { symbol: 'JPM', companyName: 'JPMorgan Chase', percentOfPortfolio: 12.2 },
    ],
  },
  {
    id: 'ossoff',
    name: 'Jon Ossoff',
    party: 'D',
    chamber: 'Senate',
    state: 'GA',
    totalTrades: 28,
    lastUpdated: 'Oct 2024',
    holdings: [
      { symbol: 'MSFT', companyName: 'Microsoft', percentOfPortfolio: 24.5 },
      { symbol: 'AAPL', companyName: 'Apple', percentOfPortfolio: 21.3 },
      { symbol: 'JNJ', companyName: 'Johnson & Johnson', percentOfPortfolio: 16.8 },
      { symbol: 'PG', companyName: 'Procter & Gamble', percentOfPortfolio: 14.2 },
      { symbol: 'KO', companyName: 'Coca-Cola', percentOfPortfolio: 12.6 },
      { symbol: 'PEP', companyName: 'PepsiCo', percentOfPortfolio: 10.6 },
    ],
  },
  {
    id: 'mccaul',
    name: 'Michael McCaul',
    party: 'R',
    chamber: 'House',
    state: 'TX',
    totalTrades: 156,
    lastUpdated: 'Nov 2024',
    holdings: [
      { symbol: 'XOM', companyName: 'Exxon Mobil', percentOfPortfolio: 32.5 },
      { symbol: 'CVX', companyName: 'Chevron', percentOfPortfolio: 26.8 },
      { symbol: 'COP', companyName: 'ConocoPhillips', percentOfPortfolio: 20.4 },
      { symbol: 'HAL', companyName: 'Halliburton', percentOfPortfolio: 12.8 },
      { symbol: 'SLB', companyName: 'Schlumberger', percentOfPortfolio: 7.5 },
    ],
  },
];

interface PortfolioCloningProps {
  onClonePortfolio: (symbols: string[]) => void;
  loading: boolean;
}

export function PortfolioCloning({ onClonePortfolio, loading }: PortfolioCloningProps) {
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null);
  const [selectedCongress, setSelectedCongress] = useState<string | null>(null);

  const handleCloneInvestor = (investor: InvestorProfile) => {
    setSelectedInvestor(investor.id);
    const symbols = investor.holdings.map(h => h.symbol);
    onClonePortfolio(symbols);
  };

  const handleCloneCongress = (member: CongressMember) => {
    setSelectedCongress(member.id);
    const symbols = member.holdings.map(h => h.symbol);
    onClonePortfolio(symbols);
  };

  const getPartyColor = (party: 'R' | 'D' | 'I') => {
    switch (party) {
      case 'R': return 'bg-red-100 text-red-800 border-red-300';
      case 'D': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'I': return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-600 rounded-lg">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl">Portfolio Cloning</h2>
          <p className="text-sm text-gray-600">
            Analyze investment strategies of famous investors and US Congress members
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Alert className="border-purple-200 bg-purple-50">
          <Award className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-800">
            <strong>📊 Clone & Analyze:</strong> Select any portfolio below to analyze it with OpenBox scoring.
            All holdings will be scored using our proprietary algorithm across Growth, Value, Health, and Momentum dimensions.
          </AlertDescription>
        </Alert>
        
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>⚡ API Usage:</strong> Each portfolio contains 5-6 stocks. With Alpha Vantage's free tier (25 requests/day),
            you can clone approximately 4 portfolios per day. Cached data reduces API calls for previously analyzed stocks.
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="investors" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="investors" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Famous Investors
          </TabsTrigger>
          <TabsTrigger value="congress" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            US Congress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="investors" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FAMOUS_INVESTORS.map((investor) => (
              <Card
                key={investor.id}
                className={`hover:shadow-lg transition-shadow cursor-pointer ${
                  selectedInvestor === investor.id ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <Avatar className="h-12 w-12 bg-gradient-to-br from-purple-500 to-blue-600">
                      <AvatarFallback className="text-white">
                        {investor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                      {investor.performance}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{investor.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {investor.title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{investor.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Portfolio Value:</span>
                      <span className="font-semibold">{investor.totalValue}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Holdings:</span>
                      <span className="font-semibold">{investor.holdings.length} stocks</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Updated:</span>
                      <span className="text-xs text-gray-500">{investor.lastUpdated}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-600 mb-2">Strategy:</p>
                    <p className="text-xs text-gray-500 italic line-clamp-2">
                      {investor.strategy}
                    </p>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-600 mb-2">Top Holdings:</p>
                    <div className="space-y-1">
                      {investor.holdings.slice(0, 3).map((holding) => (
                        <div
                          key={holding.symbol}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="font-medium">{holding.symbol}</span>
                          <span className="text-gray-500">
                            {holding.percentOfPortfolio.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleCloneInvestor(investor)}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Clone & Analyze Portfolio
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="congress" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CONGRESS_MEMBERS.map((member) => (
              <Card
                key={member.id}
                className={`hover:shadow-lg transition-shadow cursor-pointer ${
                  selectedCongress === member.id ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-500 to-red-500">
                      <AvatarFallback className="text-white">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <Badge className={getPartyColor(member.party)}>
                      {member.party} - {member.state}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {member.chamber} Member
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Trades (2024):</span>
                      <Badge variant="secondary">{member.totalTrades}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tracked Holdings:</span>
                      <span className="font-semibold">{member.holdings.length} stocks</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="text-xs text-gray-500">{member.lastUpdated}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-600 mb-2">Recent Positions:</p>
                    <div className="space-y-1">
                      {member.holdings.slice(0, 4).map((holding) => (
                        <div
                          key={holding.symbol}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="font-medium">{holding.symbol}</span>
                          <span className="text-gray-500">
                            {holding.percentOfPortfolio.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Alert className="py-2 px-3 border-yellow-200 bg-yellow-50">
                    <AlertDescription className="text-xs text-yellow-800">
                      ⚠️ Congressional trading data is based on public disclosures (STOCK Act)
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => handleCloneCongress(member)}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Clone & Analyze Portfolio
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
