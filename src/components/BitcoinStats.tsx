import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bitcoin, Hash, Clock, Users, Database, Target, DollarSign, TrendingUp, AlertCircle, Activity, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlockData {
  height: number;
  hash?: string;
  id?: string;
  time: number;
  timestamp: number;
  tx_count: number;
  size: number;
  weight: number;
  difficulty: number;
  merkle_root: string;
  nonce: number;
  version: number;
}

interface MemPoolStats {
  count: number;
  vsize: number;
  total_fee: number;
}

interface BitcoinPrice {
  bitcoin: {
    usd: number;
    usd_24h_change: number;
  };
}

interface FearGreedData {
  data: [{
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update: string;
  }];
}

interface BlockchainStats {
  market_price_usd: number;
  hash_rate: number;
  total_fees_btc: number;
  estimated_transaction_volume_usd: number;
  difficulty: number;
  totalbc: number;
  n_tx: number;
}

const BitcoinStats = () => {
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [memPoolStats, setMemPoolStats] = useState<MemPoolStats | null>(null);
  const [bitcoinPrice, setBitcoinPrice] = useState<BitcoinPrice | null>(null);
  const [fearGreedIndex, setFearGreedIndex] = useState<FearGreedData | null>(null);
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchBitcoinData = async () => {
    try {
      setLoading(true);
      
      // Fetch latest block hash
      const blockResponse = await fetch('https://mempool.space/api/blocks/tip/hash');
      const blockHash = await blockResponse.text();
      console.log('Block hash:', blockHash);
      
      // Fetch block details using the hash
      const blockDetailsResponse = await fetch(`https://mempool.space/api/block/${blockHash}`);
      const blockDetails = await blockDetailsResponse.json();
      console.log('Block details:', blockDetails);
      
      // Fetch mempool statistics
      const mempoolResponse = await fetch('https://mempool.space/api/mempool');
      const mempoolData = await mempoolResponse.json();
      console.log('Mempool data:', mempoolData);
      
      // Fetch Bitcoin price from CoinGecko (free API)
      const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
      const priceData = await priceResponse.json();
      console.log('Price data:', priceData);

      // Fetch Fear & Greed Index (free API)
      const fearGreedResponse = await fetch('https://api.alternative.me/fng/');
      const fearGreedData = await fearGreedResponse.json();
      console.log('Fear & Greed data:', fearGreedData);

      // Fetch additional blockchain stats (free API)
      const blockchainStatsResponse = await fetch('https://api.blockchain.info/stats');
      const blockchainStatsData = await blockchainStatsResponse.json();
      console.log('Blockchain stats:', blockchainStatsData);
      
      setBlockData(blockDetails);
      setMemPoolStats(mempoolData);
      setBitcoinPrice(priceData);
      setFearGreedIndex(fearGreedData);
      setBlockchainStats(blockchainStatsData);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching Bitcoin data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Bitcoin data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBitcoinData();
    // Update every 30 seconds
    const interval = setInterval(fetchBitcoinData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDifficulty = (difficulty: number) => {
    return (difficulty / 1e12).toFixed(2) + 'T';
  };

  const formatHashRate = (hashRate: number) => {
    return (hashRate / 1e18).toFixed(2) + ' EH/s';
  };

  const getFearGreedColor = (value: number) => {
    if (value <= 20) return 'text-red-600';
    if (value <= 40) return 'text-orange-500';
    if (value <= 60) return 'text-yellow-500';
    if (value <= 80) return 'text-green-500';
    return 'text-green-600';
  };

  const calculateMVRV = () => {
    if (!bitcoinPrice || !blockchainStats) return null;
    // Approximate MVRV using available data
    // Market Cap = Price * Total Supply
    const totalSupply = blockchainStats.totalbc / 100000000; // Convert from satoshis
    const marketCap = bitcoinPrice.bitcoin.usd * totalSupply;
    // Using estimated transaction volume as a proxy for realized value (simplified)
    const estimatedRealizedValue = blockchainStats.estimated_transaction_volume_usd * 365 * 4; // Very rough estimate
    return (marketCap / estimatedRealizedValue).toFixed(2);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg">Loading Bitcoin data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Bitcoin className="h-12 w-12 text-primary animate-pulse-bitcoin" />
          <h1 className="text-4xl font-bold bg-gradient-bitcoin bg-clip-text text-transparent">
            Bitcoin Network Monitor
          </h1>
        </div>
        {lastUpdated && (
          <Badge variant="secondary" className="space-x-1">
            <Clock className="h-3 w-3" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </Badge>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Bitcoin Price */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bitcoin Price</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${bitcoinPrice ? formatNumber(bitcoinPrice.bitcoin.usd) : '-'}
            </div>
            {bitcoinPrice && (
              <div className={`text-sm font-medium mt-1 flex items-center space-x-1 ${
                bitcoinPrice.bitcoin.usd_24h_change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`h-3 w-3 ${bitcoinPrice.bitcoin.usd_24h_change < 0 ? 'rotate-180' : ''}`} />
                <span>
                  {bitcoinPrice.bitcoin.usd_24h_change >= 0 ? '+' : ''}{bitcoinPrice.bitcoin.usd_24h_change.toFixed(2)}% (24h)
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Block Height */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Block Height</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{blockData ? formatNumber(blockData.height) : '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">Current blockchain height</p>
          </CardContent>
        </Card>

        {/* Block Hash */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Latest Block Hash</CardTitle>
            <Hash className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono break-all text-foreground">
              {blockData?.id ? `${blockData.id.substring(0, 16)}...` : 
               blockData?.hash ? `${blockData.hash.substring(0, 16)}...` : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Block identifier</p>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{blockData ? formatNumber(blockData.tx_count) : '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">In latest block</p>
          </CardContent>
        </Card>

        {/* Block Size */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Block Size</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{blockData ? formatBytes(blockData.size) : '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">Block data size</p>
          </CardContent>
        </Card>

        {/* Difficulty */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Difficulty</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{blockData ? formatDifficulty(blockData.difficulty) : '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">Mining difficulty</p>
          </CardContent>
        </Card>

        {/* Block Time */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Block Time</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-foreground">
              {blockData ? formatTime(blockData.timestamp || blockData.time) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">When block was mined</p>
          </CardContent>
        </Card>

        {/* Fear & Greed Index */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fear & Greed</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${fearGreedIndex ? getFearGreedColor(parseInt(fearGreedIndex.data[0].value)) : 'text-primary'}`}>
              {fearGreedIndex ? fearGreedIndex.data[0].value : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {fearGreedIndex ? fearGreedIndex.data[0].value_classification : 'Market sentiment'}
            </p>
          </CardContent>
        </Card>

        {/* Hash Rate */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hash Rate</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {blockchainStats ? formatHashRate(blockchainStats.hash_rate) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Network security</p>
          </CardContent>
        </Card>

        {/* MVRV Approximation */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MVRV (Est.)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {calculateMVRV() || '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Market/Realized Value</p>
          </CardContent>
        </Card>

        {/* Network Activity */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Network Activity</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-primary">
              {blockchainStats ? `$${(blockchainStats.estimated_transaction_volume_usd / 1000000000).toFixed(1)}B` : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Daily transaction volume</p>
          </CardContent>
        </Card>
      </div>

      {/* Mempool Stats */}
      {memPoolStats && (
        <Card className="bg-gradient-card border-border shadow-card animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Mempool Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{formatNumber(memPoolStats.count)}</div>
                <p className="text-sm text-muted-foreground">Pending Transactions</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{formatBytes(memPoolStats.vsize)}</div>
                <p className="text-sm text-muted-foreground">Mempool Size</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{(memPoolStats.total_fee / 100000000).toFixed(2)} BTC</div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Metrics Notice */}
      <Card className="bg-gradient-card border-border shadow-card animate-slide-up border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
            <AlertCircle className="h-5 w-5" />
            <span>On-Chain Metrics Available!</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Here are the free on-chain metrics now included:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-green-600 dark:text-green-400">✅ Available Now:</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Bitcoin Price & 24h Change</li>
                  <li>• Fear & Greed Index (Market Sentiment)</li>
                  <li>• Network Hash Rate</li>
                  <li>• MVRV Ratio (Estimated)</li>
                  <li>• Network Transaction Volume</li>
                  <li>• Mempool Statistics</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-yellow-600 dark:text-yellow-400">⚠️ Premium Only:</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Precise NUPL (Net Unrealized P/L)</li>
                  <li>• SOPR Ratio (Short/Long Term)</li>
                  <li>• Exchange Whale Ratio</li>
                  <li>• Realized Cap (Exact)</li>
                  <li>• Coindays Destroyed</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  These require paid APIs but the free metrics above provide excellent market insights!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BitcoinStats;
