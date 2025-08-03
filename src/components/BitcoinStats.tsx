import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bitcoin, Hash, Clock, Users, Database, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlockData {
  height: number;
  hash: string;
  time: number;
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

const BitcoinStats = () => {
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [memPoolStats, setMemPoolStats] = useState<MemPoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchBitcoinData = async () => {
    try {
      setLoading(true);
      
      // Fetch latest block data from mempool.space API
      const blockResponse = await fetch('https://mempool.space/api/blocks/tip/height');
      const blockHeight = await blockResponse.json();
      
      const blockDetailsResponse = await fetch(`https://mempool.space/api/block/${blockHeight}`);
      const blockDetails = await blockDetailsResponse.json();
      
      // Fetch mempool statistics
      const mempoolResponse = await fetch('https://mempool.space/api/mempool');
      const mempoolData = await mempoolResponse.json();
      
      setBlockData(blockDetails);
      setMemPoolStats(mempoolData);
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
              {blockData ? `${blockData.hash.substring(0, 16)}...` : '-'}
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
            <div className="text-sm font-medium text-foreground">{blockData ? formatTime(blockData.time) : '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">When block was mined</p>
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
    </div>
  );
};

export default BitcoinStats;