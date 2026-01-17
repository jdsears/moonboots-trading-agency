import { Moon, Shield, Zap, Brain, ArrowRight } from 'lucide-react';
import ConnectWallet from '../components/ConnectWallet';

function Landing() {
  return (
    <div className="min-h-screen bg-moonboots-dark">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-moonboots-purple/20 via-transparent to-moonboots-gold/10" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <img src="/logo.png" alt="MoonBoots" className="h-10 w-auto" />
            <span className="text-2xl font-bold gradient-text">MoonBoots Trading Agency</span>
          </div>

          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                AI-Powered Trading
                <br />
                <span className="gradient-text">For VIP Members</span>
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                Access the most competitive crypto trading fees with AI-driven insights.
                Exclusive to MoonBoots MB1 & Chappyz NFT holders.
              </p>

              {/* Features */}
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-moonboots-purple/20 rounded-lg">
                    <Zap className="w-5 h-5 text-moonboots-purple" />
                  </div>
                  <div>
                    <p className="font-medium">0.5% Trading Fee</p>
                    <p className="text-sm text-gray-500">vs 0.8-1% competitors</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-moonboots-purple/20 rounded-lg">
                    <Brain className="w-5 h-5 text-moonboots-purple" />
                  </div>
                  <div>
                    <p className="font-medium">AI Trading Agents</p>
                    <p className="text-sm text-gray-500">Powered by Chappyz</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-moonboots-purple/20 rounded-lg">
                    <Shield className="w-5 h-5 text-moonboots-purple" />
                  </div>
                  <div>
                    <p className="font-medium">NFT-Gated Access</p>
                    <p className="text-sm text-gray-500">Exclusive to holders</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-moonboots-gold/20 rounded-lg">
                    <Moon className="w-5 h-5 text-moonboots-gold" />
                  </div>
                  <div>
                    <p className="font-medium">MBDAO Buybacks</p>
                    <p className="text-sm text-gray-500">50% of fees support token</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connect Card */}
            <div className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">
                Connect to verify your NFT holdings and start trading
              </p>
              
              <ConnectWallet />

              <div className="mt-8 pt-6 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-4">Required to access:</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://opensea.io/collection/moonboots-mb1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    MoonBoots MB1
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="https://opensea.io/collection/chappyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Chappyz
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Comparison */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Competitive Fee Structure</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card text-center">
            <p className="text-sm text-gray-400 mb-2">Standard Member</p>
            <p className="text-4xl font-bold text-moonboots-purple">0.5%</p>
            <p className="text-xs text-gray-500 mt-2">MB1 or Chappyz holder</p>
          </div>
          <div className="card text-center border-moonboots-gold">
            <p className="text-sm text-moonboots-gold mb-2">VIP Member</p>
            <p className="text-4xl font-bold text-moonboots-gold">0.4%</p>
            <p className="text-xs text-gray-500 mt-2">+ MBDAO VIP NFT</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-400 mb-2">Max Discount</p>
            <p className="text-4xl font-bold text-green-400">0.375%</p>
            <p className="text-xs text-gray-500 mt-2">VIP + 10000 MBDAO tokens</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>Built with 💜 for MoonBoots Community</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="https://opensea.io/collection/moonboots-mb1" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              MB1 Collection
            </a>
            <a href="https://opensea.io/collection/chappyz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Chappyz
            </a>
            <a href="https://opensea.io/collection/mbdao-vip" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              MBDAO VIP
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
