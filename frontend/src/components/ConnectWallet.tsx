import { useConnect } from 'wagmi';
import { Wallet } from 'lucide-react';

function ConnectWallet() {
  const { connect, connectors, isPending } = useConnect();

  return (
    <div className="space-y-3">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-moonboots-dark-light border border-gray-700 rounded-xl hover:border-moonboots-purple hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          <Wallet className="w-5 h-5 text-moonboots-purple" />
          <span className="font-medium">
            {isPending ? 'Connecting...' : connector.name}
          </span>
        </button>
      ))}
    </div>
  );
}

export default ConnectWallet;
