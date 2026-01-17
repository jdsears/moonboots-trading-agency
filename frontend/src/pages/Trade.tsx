import { useState } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useMutation } from '@tanstack/react-query';
import { ArrowDownUp, Brain, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useTradingStore, TOKEN_LIST } from '../lib/store';
import { getQuote, getAnalysis, reportTradeComplete } from '../lib/api';
import TokenSelect from '../components/TokenSelect';
import AIAnalysis from '../components/AIAnalysis';

function Trade() {
  const { address } = useAccount();
  const {
    accessStatus,
    selectedChainId,
    sellToken,
    setSellToken,
    buyToken,
    setBuyToken,
    sellAmount,
    setSellAmount,
    marketAnalysis,
    setMarketAnalysis,
    tradeRecommendation,
    setTradeRecommendation,
    isAnalyzing,
    setIsAnalyzing,
  } = useTradingStore();

  const [quote, setQuote] = useState<Awaited<ReturnType<typeof getQuote>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { sendTransaction, data: txHash, isPending: isSending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Get quote mutation
  const quoteMutation = useMutation({
    mutationFn: async () => {
      if (!address || !sellToken || !buyToken || !sellAmount) {
        throw new Error('Missing required fields');
      }

      const amount = parseEther(sellAmount);

      return getQuote({
        chainId: selectedChainId,
        sellToken,
        buyToken,
        sellAmount: amount.toString(),
        taker: address,
      });
    },
    onSuccess: (data) => {
      setQuote(data);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      setQuote(null);
    },
  });

  // AI Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async () => {
      if (!address || !buyToken) {
        throw new Error('Select a token to analyze');
      }

      const token = TOKEN_LIST[selectedChainId]?.find((t) => t.address === buyToken);
      if (!token) throw new Error('Token not found');

      setIsAnalyzing(true);
      return getAnalysis({
        tokenSymbol: token.symbol,
        chainId: selectedChainId,
        currentPrice: quote?.price || '0',
        userBalance: sellAmount || '0',
        walletAddress: address,
        tokenAddress: buyToken,
      });
    },
    onSuccess: (data) => {
      setMarketAnalysis(data.market);
      setTradeRecommendation(data.recommendation);
      setIsAnalyzing(false);
    },
    onError: () => {
      setIsAnalyzing(false);
    },
  });

  // Execute swap
  const handleSwap = async () => {
    if (!quote) return;

    try {
      sendTransaction({
        to: quote.to,
        data: quote.data as `0x${string}`,
        value: BigInt(quote.value),
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Report trade completion
  if (isSuccess && txHash && quote) {
    const feeAmount = parseFloat(sellAmount) * (quote.access.effectiveFeeBps / 10000);
    reportTradeComplete(txHash, feeAmount);
  }

  const buyTokenInfo = TOKEN_LIST[selectedChainId]?.find((t) => t.address === buyToken);

  // Check access
  if (!accessStatus?.hasAccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Required</h2>
          <p className="text-gray-400 mb-6">
            You need to hold a MoonBoots MB1 or Chappyz NFT to access trading.
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
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Trade Panel */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Swap Tokens</h2>

            {/* Sell Token */}
            <div className="space-y-4">
              <TokenSelect
                chainId={selectedChainId}
                selectedToken={sellToken}
                onSelect={setSellToken}
                label="You Pay"
              />
              <input
                type="text"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="0.0"
                className="w-full text-2xl bg-transparent border-none focus:outline-none"
              />
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center my-4">
              <button
                onClick={() => {
                  const temp = sellToken;
                  setSellToken(buyToken);
                  setBuyToken(temp);
                }}
                className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowDownUp className="w-5 h-5 text-moonboots-purple" />
              </button>
            </div>

            {/* Buy Token */}
            <TokenSelect
              chainId={selectedChainId}
              selectedToken={buyToken}
              onSelect={setBuyToken}
              label="You Receive"
            />

            {/* Quote Display */}
            {quote && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price</span>
                  <span>1 {TOKEN_LIST[selectedChainId]?.find(t => t.address === sellToken)?.symbol} = {parseFloat(quote.price).toFixed(6)} {buyTokenInfo?.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">You Receive</span>
                  <span>{(BigInt(quote.buyAmount) / BigInt(10 ** (buyTokenInfo?.decimals || 18))).toString()} {buyTokenInfo?.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee</span>
                  <span className={quote.access.feeDiscount > 0 ? 'text-green-400' : ''}>
                    {(quote.access.effectiveFeeBps / 100).toFixed(2)}%
                    {quote.access.feeDiscount > 0 && ' (discounted)'}
                  </span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Success Display */}
            {isSuccess && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-green-400 text-sm">Swap successful!</p>
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-moonboots-purple hover:underline"
                  >
                    View transaction
                  </a>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={() => quoteMutation.mutate()}
                disabled={!sellToken || !buyToken || !sellAmount || quoteMutation.isPending}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                {quoteMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Get Quote'
                )}
              </button>

              {quote && (
                <button
                  onClick={handleSwap}
                  disabled={isSending || isConfirming}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {isSending || isConfirming ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isConfirming ? 'Confirming...' : 'Swapping...'}
                    </>
                  ) : (
                    'Swap'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* AI Analysis Button */}
          <button
            onClick={() => analysisMutation.mutate()}
            disabled={!buyToken || isAnalyzing}
            className="w-full card flex items-center justify-center gap-3 py-4 hover:border-moonboots-purple transition-colors cursor-pointer"
          >
            <Brain className={`w-5 h-5 ${isAnalyzing ? 'animate-pulse' : ''} text-moonboots-purple`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Get AI Analysis'}</span>
          </button>
        </div>

        {/* AI Analysis Panel */}
        <AIAnalysis
          market={marketAnalysis}
          recommendation={tradeRecommendation}
          isLoading={isAnalyzing}
        />
      </div>
    </div>
  );
}

export default Trade;
