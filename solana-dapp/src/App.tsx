import { useState, useEffect } from "react";
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { Buffer } from "buffer";
import "./App.css";


const SOLANA_NETWORK = "https://api.devnet.solana.com"; 

// Asegúrate de tener las conversiones para cada token aquí
const convertToToken = (solAmount: number, token: string) => {
  switch (token) {
    case "GROW":
      return solAmount * 123_456_789; // 1 SOL = 1,000,000 GROW
    case "MFT":
      return solAmount * 15_247.64; // 1 SOL = 500,000 MFT (Ejemplo)
    default:
      return 0;
  }
};

const abbreviateWalletAddress = (address: string | null): string => {
  if (!address) return "Conectar Wallet";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0.01); // Ahora es un número
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<string>("GROW"); // Estado para el token seleccionado

  const solToToken = (solAmount: number) => convertToToken(solAmount, selectedToken);

  const connectWallet = async () => {
    if ("solana" in window) {
      const provider = (window as any).solana;
      if (provider.isPhantom) {
        try {
          const response = await provider.connect();
          setWalletAddress(response.publicKey.toString());
          setMessage("✅ Billetera conectada con éxito!");
          setShowModal(true);
        } catch (error) {
          console.error("Error connecting wallet:", error);
          setMessage("❌ Error al conectar la billetera. Intenta nuevamente.");
          setShowModal(true);
        }
      }
    } else {
      setMessage("❌ Phantom Wallet no encontrado.");
      setShowModal(true);
    }
  };

  const getBalance = async () => {
    if (!walletAddress) return;

    const connection = new Connection(SOLANA_NETWORK, "confirmed");
    const balance = await connection.getBalance(new PublicKey(walletAddress));
    setBalance(balance / 1e9); // Convierte de lamports a SOL
  };

  const sendTransaction = async () => {
    if (!walletAddress) {
      setMessage("❌ ¡Por favor, conecta tu billetera primero!");
      setShowModal(true);
      return;
    }

    const recipient = "growH7StrQsCjiyN62yxVyFZd2SxfKVAogokuRN5dFZ";

    if (amount <= 0) {
      setMessage("❌ ¡Por favor ingresa un monto válido!");
      setShowModal(true);
      return;
    }

    try {
      setIsLoading(true);
      setMessage("📤 Iniciando transacción...");
      setShowModal(true);

      const connection = new Connection(SOLANA_NETWORK, "confirmed");
      const fromWallet = (window as any).solana;

      const { blockhash } = await connection.getLatestBlockhash("finalized");
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(walletAddress),
          toPubkey: new PublicKey(recipient),
          lamports: amount * 1e9, // Sol a lamports
        })
      );

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(walletAddress);

      const signedTransaction = await fromWallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      setMessage(`🚀 Transacción enviada con éxito! Signature: ${signature}`);
      setShowModal(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`❌ Error: ${error.message}`);
      } else {
        setMessage("❌ Unknown error occurred");
      }
      setShowModal(true);
        
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setMessage(null);
  };

  useEffect(() => {
    if ("solana" in window) {
      const provider = (window as any).solana;
      if (provider.isPhantom) {
        setWalletAddress(provider.publicKey?.toString() || null);
      }
    }

    if (walletAddress) {
      getBalance(); // Obtener balance al conectar
    }

    if (typeof window !== "undefined") {
      (window as any).Buffer = Buffer;
    }
  }, [walletAddress]);

  return (
    <div className="app">
      <div className="connect-button-container">
        <button onClick={connectWallet} className="connect-button">
          {walletAddress ? abbreviateWalletAddress(walletAddress) : "Conectar Phantom Wallet"}
        </button>
      </div>

      <header className="header">
        <h1>GrowSwap Beta</h1>
          <div className="appi">
           <img src="../logo (3).png" alt="Logo" className="logo" />
          </div>
       </header>
      

      <main className="main">
        {walletAddress && (
          <>
            <div className="wallet-info">
              Balance: {balance.toFixed(2)} SOL
            </div>

         {/* Selector de token */}
         <div className="input-group">
              <label htmlFor="token">Selecciona un token:</label>
              <select
                id="token"
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
              >
                <option value="GROW">GROW</option>
                <option value="MFT">MFT</option>
              </select>
            </div>

            {/* Input manual */}
            <div className="input-group">
              <label htmlFor="amount">Monto (en SOL):</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                step="0.01"
                min="0.01"
              />
            </div>

               {/* Barra deslizante */}
               <div className="input-group">
              
              <input
                type="range"
                id="slider"
                min="0.01"
                max={balance}  // El máximo es el balance del usuario
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="slider"
              />
            </div>

            

            <div className="input-group">
              <label htmlFor="token-amount">Monto en {selectedToken}:</label>
              <input
                type="text"
                id="token-amount"
                value={solToToken(amount).toLocaleString()}
                disabled
              />
            </div>

            <button onClick={sendTransaction} disabled={isLoading} className="send-button">
              {isLoading ? <div className="spinner"></div> : "Enviar"}
            </button>
          </>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal show">
            <p>{message}</p>
            <button onClick={closeModal} className="modal-close-button">Cerrar</button>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>Hecho con 💜</p>
      </footer>
    </div>
  );
}

export default App;
