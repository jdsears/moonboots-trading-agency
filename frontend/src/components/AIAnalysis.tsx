import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb } from 'lucide-react';
import type { MarketAnalysis, TradeRecommendation } from '../lib/api';

interface AIAnalysisProps {
  market: MarketAnalysis | null;
  recommendation: TradeRecommendation | null;
  isLoading: boolean;
}

function AIAnalysis({ market, recommendation, isLoading }: AIAnalysisProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-moonboots-purple animate-pulse" />
          <h3 className="text-lg font-semibold">AI Analyzing...</h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded loading-shimmer" />
          <div className="h-4 bg-gray-700 rounded loading-shimmer w-3/4" />
          <div className="h-4 bg-gray-700 rounded loading-shimmer w-1/2" />
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="card text-center py-8">
        <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Select tokens and enter an amount to get AI analysis</p>
      </div>
    );
  }

  const SentimentIcon = {
    bullish: TrendingUp,
    bearish: TrendingDown,
    neutral: Minus,
  }[market.sentiment];

  const sentimentColor = {
    bullish: 'text-green-400',
    bearish: 'text-red-400',
    neutral: 'text-yellow-400',
  }[market.sentiment];

  const riskColor = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
  }[market.riskLevel];

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-moonboots-purple" />
        <h3 className="text-lg font-semibold">AI Analysis</h3>
      </div>

      {/* Market Summary */}
      <div>
        <p className="text-gray-300">{market.summary}</p>
      </div>

      {/* Sentiment & Risk */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <SentimentIcon className={`w-5 h-5 ${sentimentColor}`} />
            <span className="text-sm text-gray-400">Sentiment</span>
          </div>
          <p className={`text-lg font-semibold capitalize ${sentimentColor}`}>
            {market.sentiment}
          </p>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`w-5 h-5 ${riskColor}`} />
            <span className="text-sm text-gray-400">Risk Level</span>
          </div>
          <p className={`text-lg font-semibold capitalize ${riskColor}`}>
            {market.riskLevel}
          </p>
        </div>
      </div>

      {/* Opportunities */}
      {market.opportunities.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-gray-300">Opportunities</span>
          </div>
          <ul className="space-y-1">
            {market.opportunities.map((opp, i) => (
              <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                <span className="text-green-400">•</span>
                {opp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {market.warnings.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">Warnings</span>
          </div>
          <ul className="space-y-1">
            {market.warnings.map((warn, i) => (
              <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                {warn}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className="p-4 bg-moonboots-purple/10 border border-moonboots-purple/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-moonboots-purple">Recommendation</span>
            <span className="text-xs text-gray-400">
              {(recommendation.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
          <p className={`text-2xl font-bold capitalize ${
            recommendation.action === 'buy' ? 'text-green-400' :
            recommendation.action === 'sell' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {recommendation.action}
          </p>
          <p className="text-sm text-gray-400 mt-2">{recommendation.reasoning}</p>
          {recommendation.suggestedAmount && (
            <p className="text-sm text-gray-300 mt-2">
              Suggested: {recommendation.suggestedAmount}
            </p>
          )}
        </div>
      )}

      {/* Overall Recommendation */}
      <div className="pt-4 border-t border-gray-700">
        <p className="text-sm text-gray-400 italic">{market.recommendation}</p>
      </div>
    </div>
  );
}

export default AIAnalysis;
