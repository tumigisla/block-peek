import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bitcoin, Hash, Clock, Users, Database, DollarSign, TrendingUp, AlertCircle, Activity, Copy, Check, ExternalLink } from "lucide-react";
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

interface MvrvData {
  d: string;
  unixTs: string;
  mvrv: string;
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
  const [mvrvData, setMvrvData] = useState<MvrvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchBitcoinData = async () => {
    try {
      setLoading(true);
      
      // Fetch each API independently with error handling
      const promises = [
        // Mempool.space APIs (usually reliable)
        fetch('https://mempool.space/api/blocks/tip/hash')
          .then(response => response.text())
          .then(hash => fetch(`https://mempool.space/api/block/${hash}`))
          .then(response => response.json())
          .then(data => setBlockData(data))
          .catch(err => console.warn('Block data fetch failed:', err)),
        
        fetch('https://mempool.space/api/mempool')
          .then(response => response.json())
          .then(data => setMemPoolStats(data))
          .catch(err => console.warn('Mempool stats fetch failed:', err)),
        
        // CoinGecko API (may have rate limits)
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true')
          .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
          })
          .then(data => setBitcoinPrice(data))
          .catch(err => {
            console.warn('Bitcoin price fetch failed:', err);
            setBitcoinPrice(null);
          }),

        // Fear & Greed Index
        fetch('https://api.alternative.me/fng/')
          .then(response => response.json())
          .then(data => setFearGreedIndex(data))
          .catch(err => console.warn('Fear & Greed fetch failed:', err)),

        // Blockchain.info stats
        fetch('https://api.blockchain.info/stats')
          .then(response => response.json())
          .then(data => setBlockchainStats(data))
          .catch(err => console.warn('Blockchain stats fetch failed:', err)),

        // MVRV data - Removing due to unreliable API
        // fetch('https://bitcoin-data.com/v1/mvrv/1')
        //   .then(response => response.json())
        //   .then(data => setMvrvData(data))
        //   .catch(err => {
        //     console.warn('MVRV data fetch failed:', err);
        //     setMvrvData(null);
        //   })
      ];

      await Promise.allSettled(promises);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error in fetchBitcoinData:', error);
      toast({
        title: "Error",
        description: "Some data sources may be unavailable. Showing available data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBitcoinData();
    // Update every 2 minutes
    const interval = setInterval(fetchBitcoinData, 120000);
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


  const getFearGreedColor = (value: number) => {
    if (value <= 20) return 'text-red-600';
    if (value <= 40) return 'text-orange-500';
    if (value <= 60) return 'text-yellow-500';
    if (value <= 80) return 'text-green-500';
    return 'text-green-600';
  };

  const calculateMVRV = () => {
    // Use real MVRV data from API, convert string to number
    return mvrvData ? parseFloat(mvrvData.mvrv) : null;
  };

  const getMVRVColor = (value: number) => {
    if (value >= 3.7) return 'text-red-600 dark:text-red-400';
    if (value >= 2.8) return 'text-orange-500 dark:text-orange-400';
    if (value >= 2.0) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-green-500 dark:text-green-400';
  };

  const getMVRVLabel = (value: number) => {
    if (value >= 3.7) return 'Cycle Top Risk';
    if (value >= 2.8) return 'Overvaluation Risk';
    if (value >= 2.0) return 'Fair Value';
    return 'Undervalued';
  };

  const getMVRVProgress = (value: number) => {
    // Scale from 0 to 5 for visual representation
    const maxScale = 5;
    const percentage = Math.min((value / maxScale) * 100, 100);
    return percentage;
  };

  const getBlockReward = (blockHeight: number) => {
    // Bitcoin halving occurs every 210,000 blocks
    // Initial reward was 50 BTC, halves each period
    const halvingInterval = 210000;
    const halvings = Math.floor(blockHeight / halvingInterval);
    const initialReward = 50;
    return initialReward / Math.pow(2, halvings);
  };

  const getPriceContext = (price: number) => {
    // Bitcoin price reference points (approximate)
    if (price > 100000) return { label: 'Near ATH', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/20' };
    if (price > 80000) return { label: 'Very High', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' };
    if (price > 50000) return { label: 'High', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/20' };
    if (price > 30000) return { label: 'Normal', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/20' };
    if (price > 20000) return { label: 'Low', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' };
    return { label: 'Very Low', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' };
  };


  const getBlockSizeContext = (sizeBytes: number) => {
    // Block size reference points
    const sizeMB = sizeBytes / (1024 * 1024);
    if (sizeMB > 3.5) return { label: 'Nearly Full', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' };
    if (sizeMB > 2.5) return { label: 'High Usage', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/20' };
    if (sizeMB > 1.5) return { label: 'Normal', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' };
    if (sizeMB > 0.5) return { label: 'Low Usage', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/20' };
    return { label: 'Very Low', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/20' };
  };

  const formatBlockHash = (hash: string) => {
    // Show first 8 and last 8 characters for better readability
    if (hash.length > 16) {
      return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
    }
    return hash;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
      toast({
        title: "Copied!",
        description: "Block hash copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
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
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Bitcoin className="h-12 w-12 text-primary animate-pulse-bitcoin" />
          <h1 className="text-4xl font-bold bg-gradient-bitcoin bg-clip-text text-transparent">
            Bitcoin Network Monitor
          </h1>
        </div>
        
        {/* External Resources */}
        <div className="flex items-center justify-center space-x-1 mb-4">
          <span className="text-xs text-muted-foreground mr-2">Resources:</span>
          <a 
            href="https://cryptoquant.com/community/dashboard/68781e2f5838ac598078c57d" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs text-muted-foreground hover:text-primary transition-colors duration-200 px-2 py-1 rounded-md hover:bg-muted/50"
          >
            <span>CryptoQuant</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-muted-foreground">•</span>
          <a 
            href="https://coinmarketcap.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs text-muted-foreground hover:text-primary transition-colors duration-200 px-2 py-1 rounded-md hover:bg-muted/50"
          >
            <span>CoinMarketCap</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-muted-foreground">•</span>
          <a 
            href="https://mempool.space" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs text-muted-foreground hover:text-primary transition-colors duration-200 px-2 py-1 rounded-md hover:bg-muted/50"
          >
            <span>Mempool.space</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {lastUpdated && (
          <Badge variant="secondary" className="space-x-1">
            <Clock className="h-3 w-3" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </Badge>
        )}
      </div>

      {/* Market Data Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Market Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="mt-2 space-y-1">
                <div className={`text-sm font-medium flex items-center space-x-1 ${
                  bitcoinPrice.bitcoin.usd_24h_change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 ${bitcoinPrice.bitcoin.usd_24h_change < 0 ? 'rotate-180' : ''}`} />
                  <span>
                    {bitcoinPrice.bitcoin.usd_24h_change >= 0 ? '+' : ''}{bitcoinPrice.bitcoin.usd_24h_change.toFixed(2)}% (24h)
                  </span>
                </div>
                <Badge className={`text-xs ${getPriceContext(bitcoinPrice.bitcoin.usd).bgColor} ${getPriceContext(bitcoinPrice.bitcoin.usd).color} border-0`}>
                  {getPriceContext(bitcoinPrice.bitcoin.usd).label}
                </Badge>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2 opacity-70">via CoinGecko</p>
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
            <p className="text-xs text-muted-foreground mt-1 opacity-70">Standard F&G Index</p>
          </CardContent>
        </Card>

        {/* MVRV Approximation */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MVRV Ratio</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {calculateMVRV() !== null ? (
              <>
                <div className={`text-2xl font-bold ${getMVRVColor(calculateMVRV()!)}`}>
                  {calculateMVRV()!.toFixed(1)}
                </div>
                <div className="mt-2 space-y-1">
                  <div className={`text-xs font-medium ${getMVRVColor(calculateMVRV()!)}`}>
                    {getMVRVLabel(calculateMVRV()!)}
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        calculateMVRV()! >= 3.7 ? 'bg-red-500' :
                        calculateMVRV()! >= 2.8 ? 'bg-orange-500' :
                        calculateMVRV()! >= 2.0 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${getMVRVProgress(calculateMVRV()!)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0</span>
                    <span className="text-orange-600">2.8</span>
                    <span className="text-red-600">3.7</span>
                    <span>5+</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 opacity-70">via Bitcoin-Data.com</p>
              </>
            ) : (
              <div className="flex items-center justify-center h-20">
                <div className="text-center">
                  <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                  <div className="text-sm text-muted-foreground">MVRV data unavailable</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        </div>
      </div>

      {/* Network Metrics Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Network Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Block Height */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Block Height</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{blockData ? formatNumber(blockData.height) : '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">Current blockchain height</p>
            <p className="text-xs text-muted-foreground mt-1 opacity-70">via Mempool.space</p>
          </CardContent>
        </Card>

        {/* Block Hash */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Latest Block Hash</CardTitle>
            <Hash className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm font-mono break-all text-foreground flex-1 mr-2">
                {blockData?.id ? formatBlockHash(blockData.id) : 
                 blockData?.hash ? formatBlockHash(blockData.hash) : '-'}
              </div>
              {(blockData?.id || blockData?.hash) && (
                <button
                  onClick={() => copyToClipboard(blockData?.id || blockData?.hash || '')}
                  className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors"
                  title="Copy full hash"
                >
                  {copiedHash ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Block identifier</p>
            <p className="text-xs text-muted-foreground mt-1 opacity-70">via Mempool.space</p>
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
            <p className="text-xs text-muted-foreground mt-1 opacity-70">via Mempool.space</p>
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
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">Block data size</p>
              {blockData && (
                <Badge className={`text-xs mt-1 ${getBlockSizeContext(blockData.size).bgColor} ${getBlockSizeContext(blockData.size).color} border-0`}>
                  {getBlockSizeContext(blockData.size).label}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground mt-1 opacity-70">via Mempool.space</p>
            </div>
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
            <p className="text-xs text-muted-foreground mt-1 opacity-70">via Mempool.space</p>
          </CardContent>
        </Card>

        {/* Block Reward */}
        <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow-bitcoin transition-all duration-300 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Block Reward</CardTitle>
            <Bitcoin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {blockData ? `${getBlockReward(blockData.height)} BTC` : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Mining reward for this block</p>
            <p className="text-xs text-muted-foreground mt-1 opacity-70">Calculated from block height</p>
          </CardContent>
        </Card>

        </div>
      </div>

    </div>
  );
};

export default BitcoinStats;
