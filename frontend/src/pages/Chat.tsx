import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMutation, useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, AlertCircle, Sparkles, Bell, TrendingUp, Target } from 'lucide-react';
import { useTradingStore } from '../lib/store';
import {
  sendChatMessage,
  ChatMessage,
  ChatResponse,
  getUserAlerts,
  getUserDCAStrategies,
  getUserLimitOrders,
} from '../lib/api';

function Chat() {
  const { address } = useAccount();
  const { accessStatus, selectedChainId } = useTradingStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch user's active strategies
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', address],
    queryFn: () => getUserAlerts(address!),
    enabled: !!address && !!accessStatus?.hasAccess,
  });

  const { data: dcaStrategies = [] } = useQuery({
    queryKey: ['dca', address],
    queryFn: () => getUserDCAStrategies(address!),
    enabled: !!address && !!accessStatus?.hasAccess,
  });

  const { data: limitOrders = [] } = useQuery({
    queryKey: ['orders', address],
    queryFn: () => getUserLimitOrders(address!),
    enabled: !!address && !!accessStatus?.hasAccess,
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const newMessages: ChatMessage[] = [
        ...messages,
        { role: 'user', content: userMessage },
      ];
      return sendChatMessage(newMessages, address!, selectedChainId);
    },
    onSuccess: (response: ChatResponse, userMessage: string) => {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response.message },
      ]);

      // Handle actions if any
      if (response.action && response.action.type !== 'none') {
        console.log('Action received:', response.action);
        // Could trigger UI updates or notifications here
      }
    },
    onError: (error: Error, userMessage: string) => {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: `Sorry, I encountered an error: ${error.message}. Please try again.` },
      ]);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setInput('');
    chatMutation.mutate(userMessage);
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    inputRef.current?.focus();
  };

  // Check access
  if (!accessStatus?.hasAccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Required</h2>
          <p className="text-gray-400 mb-6">
            You need to hold a MoonBoots MB1 or Chappyz NFT to access Luna, your AI trading assistant.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="https://opensea.io/collection/moonboots-mb1"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Get MB1
            </a>
            <a
              href="https://opensea.io/collection/chappyz"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Get Chappyz
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)]">
      <div className="grid lg:grid-cols-4 gap-6 h-full">
        {/* Chat Panel */}
        <div className="lg:col-span-3 flex flex-col h-full">
          {/* Header */}
          <div className="card mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-moonboots-purple to-moonboots-gold rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Luna</h1>
                <p className="text-sm text-gray-400">Your AI Trading Assistant</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 card overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Sparkles className="w-16 h-16 text-moonboots-purple mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Welcome to Luna!</h3>
                  <p className="text-gray-400 mb-6 max-w-md">
                    I can help you analyze tokens, execute trades, set up price alerts, and manage your trading strategies. What would you like to do?
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                    <button
                      onClick={() => handleQuickAction("What's the current price of ETH?")}
                      className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-left transition-colors"
                    >
                      Check ETH price
                    </button>
                    <button
                      onClick={() => handleQuickAction("Show me the market overview")}
                      className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-left transition-colors"
                    >
                      Market overview
                    </button>
                    <button
                      onClick={() => handleQuickAction("Set a price alert for MBDAO when it reaches $0.01")}
                      className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-left transition-colors"
                    >
                      Set price alert
                    </button>
                    <button
                      onClick={() => handleQuickAction("Create a DCA strategy to buy ETH weekly with $100")}
                      className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-left transition-colors"
                    >
                      Setup DCA
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 bg-moonboots-purple rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-moonboots-purple text-white'
                          : 'bg-gray-800 text-gray-100'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-moonboots-gold">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {chatMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-moonboots-purple rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-800 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-moonboots-purple" />
                      <span className="text-gray-400">Luna is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Luna anything about trading..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-moonboots-purple transition-colors"
                  disabled={chatMutation.isPending}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || chatMutation.isPending}
                  className="btn-primary px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar - Active Strategies */}
        <div className="space-y-4 overflow-y-auto">
          {/* Price Alerts */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-moonboots-purple" />
              <h3 className="font-semibold">Price Alerts</h3>
            </div>
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-500">No active alerts</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert, i) => (
                  <div key={i} className="p-2 bg-gray-800/50 rounded-lg text-sm">
                    <p className="font-medium">{alert.tokenSymbol}</p>
                    <p className="text-gray-400">
                      {alert.condition === 'above' ? '>' : '<'} ${alert.targetPrice}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DCA Strategies */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold">DCA Strategies</h3>
            </div>
            {dcaStrategies.length === 0 ? (
              <p className="text-sm text-gray-500">No active DCA</p>
            ) : (
              <div className="space-y-2">
                {dcaStrategies.map((dca, i) => (
                  <div key={i} className="p-2 bg-gray-800/50 rounded-lg text-sm">
                    <p className="font-medium">{dca.buyTokenSymbol}</p>
                    <p className="text-gray-400">
                      ${dca.amountPerPurchase} {dca.frequency}
                    </p>
                    <p className="text-xs text-gray-500">
                      {dca.completedPurchases} / {dca.totalPurchases || '∞'} purchases
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Limit Orders */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold">Limit Orders</h3>
            </div>
            {limitOrders.length === 0 ? (
              <p className="text-sm text-gray-500">No pending orders</p>
            ) : (
              <div className="space-y-2">
                {limitOrders.map((order, i) => (
                  <div key={i} className="p-2 bg-gray-800/50 rounded-lg text-sm">
                    <p className="font-medium">{order.sellAmount}</p>
                    <p className="text-gray-400">
                      @ ${order.targetPrice}
                    </p>
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(order.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="card bg-gradient-to-br from-moonboots-purple/20 to-moonboots-gold/20">
            <h3 className="font-semibold mb-3">Your Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">VIP Member</span>
                <span>{accessStatus?.isVIP ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">MBDAO Holder</span>
                <span>{accessStatus?.isMBDAOHolder ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fee Rate</span>
                <span className="text-green-400">
                  {((accessStatus?.effectiveFeeBps || 0) / 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
