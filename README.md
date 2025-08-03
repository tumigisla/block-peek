# Block Peek

A real-time Bitcoin network monitoring dashboard that provides comprehensive insights into the Bitcoin blockchain.

## Live Demo

🚀 **[View Live Application](https://app.lovable.dev/projects/de87270f-13ae-4d98-8e68-1abf942e6a94)**

## What does this app do?

Block Peek displays live Bitcoin network statistics and market data, including:

- **Market Data**: Current Bitcoin price, 24h price changes, Fear & Greed Index
- **Network Metrics**: Latest block height, block hash, transaction count, block size
- **Mining Stats**: Network difficulty, hash rate, MVRV ratio
- **Mempool Information**: Pending transactions and network activity

## Data Sources

This application fetches data from several free, public APIs:

- **[Mempool.space](https://mempool.space)** - Latest block data and mempool statistics
- **[Blockchain.info](https://blockchain.info)** - Network hash rate and blockchain metrics  
- **[CoinGecko](https://coingecko.com)** - Bitcoin price and market data
- **[Alternative.me](https://alternative.me)** - Fear & Greed Index

## Technologies Used

- **React** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Vite** for build tooling
- **React Query** for data fetching

## Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Install dependencies
npm install

# Start development server
npm run dev
```

## License

This project is open source and available under the MIT License.
