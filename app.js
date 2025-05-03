// Tailwind config
tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          primary: '#5D5CDE',
          secondary: '#00ffff',
          background: {
            light: '#ffffff',
            dark: '#181818'
          }
        },
        animation: {
          'pulse': 'pulse 2s ease-in-out infinite',
          'glow-border': 'glow-border 2s infinite alternate'
        },
        keyframes: {
          pulse: {
            '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
            '50%': { transform: 'scale(1.03)', opacity: '1' }
          },
          'glow-border': {
            'from': { boxShadow: '0 0 10px #1bffff, 0 0 5px #1bffff inset' },
            'to': { boxShadow: '0 0 20px #8a2be2, 0 0 10px #8a2be2 inset' }
          }
        }
      }
    }
  }
  
  // Check for dark mode preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }
  
  // Dark mode toggle handler
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (event.matches) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    // Variables
    const correctPassword = "1234"; // Demo password
    let provider, signer, contract;
    let connected = false;
    let account = null;
    const contractAddress = "0x52676f0B841d7b40740ced9A218DE532Da9BA640";
    const contractABI = [
      { inputs: [], stateMutability: "nonpayable", type: "constructor" },
      { inputs: [], name: "getBalance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
      { inputs: [], name: "owner", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
      { inputs: [{ internalType: "address payable", name: "recipient", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], 
        name: "sendFunds", outputs: [], stateMutability: "nonpayable", type: "function" },
      { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
      { stateMutability: "payable", type: "receive" }
    ];
    
    // Mock transaction history data
    const allTransactions = [
      { to: "0x52676f0b841d7b40740ced9a218de532da9ba640", amount: "0.01", date: "2023-04-30", type: "outgoing" },
      { to: "0xbdD7894608cF5fF110e3E7b2C398e6FACD9a5dBC", amount: "0.01", date: "2023-04-30", type: "incoming" },
      { to: "0xbdD7894608cF5fF110e3E7b2C398e6FACD9a5dBC", amount: "0.01", date: "2023-04-30", type: "contract" },
      { to: "0x52676f0b841d7b40740ced9a218de532da9ba640", amount: "0.01", date: "2023-04-29", type: "outgoing" }
    ];
  
    // DOM Elements
    const walletButton = document.getElementById('walletButton');
    const statusEl = document.getElementById('status');
    const sendBtn = document.getElementById('sendBtn');
    const withdrawBtn = document.getElementById('withdrawBtn');
    const sendContractBtn = document.getElementById('sendContractBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const recipientInput = document.getElementById('recipient');
    const amountInput = document.getElementById('amount');
    const contractRecipientInput = document.getElementById('contractRecipient');
    const contractAmountInput = document.getElementById('contractAmount');
    const refreshHistoryBtn = document.getElementById('refreshHistory');
    const themeToggleBtn = document.getElementById('themeToggle');
    const accountBalance = document.getElementById('account-balance');
    const refreshBalanceBtn = document.getElementById('refresh-balance');
    
    // Tab elements
    const sendTab = document.getElementById('send-tab');
    const contractTab = document.getElementById('contract-tab');
    const historyTab = document.getElementById('history-tab');
    const sendPanel = document.getElementById('send-panel');
    const contractPanel = document.getElementById('contract-panel');
    const historyPanel = document.getElementById('history-panel');
    
    // Modal elements
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const closeModalBtn = document.getElementById('closeModal');
    const modalOkBtn = document.getElementById('modalOkBtn');
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    const submitPasswordBtn = document.getElementById('submitPasswordBtn');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    // Helper functions
    function showModal(title, content) {
      modalTitle.textContent = title;
      modalContent.textContent = content;
      modal.classList.remove('hidden');
    }
    
    function hideModal() {
      modal.classList.add('hidden');
    }
    
    function showLoading() {
      loadingSpinner.classList.remove('hidden');
    }
    
    function hideLoading() {
      loadingSpinner.classList.add('hidden');
    }
    
    function updateStatus(text, isConnected = false) {
      if (isConnected) {
        statusEl.innerHTML = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">${text}</span>`;
      } else {
        statusEl.innerHTML = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">${text}</span>`;
      }
    }
    
    function shortenAddress(address) {
      return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    }
    
    // Password verification
    function verifyPassword() {
      return new Promise((resolve, reject) => {
        passwordModal.classList.remove('hidden');
        passwordError.classList.add('hidden');
        passwordInput.value = '';
        
        function handleSubmit() {
          if (passwordInput.value === correctPassword) {
            passwordModal.classList.add('hidden');
            resolve(true);
          } else {
            passwordError.classList.remove('hidden');
          }
        }
        
        function handleCancel() {
          passwordModal.classList.add('hidden');
          resolve(false);
        }
        
        submitPasswordBtn.onclick = handleSubmit;
        cancelPasswordBtn.onclick = handleCancel;
        
        passwordInput.onkeydown = (e) => {
          if (e.key === 'Enter') {
            handleSubmit();
          }
        };
      });
    }
    
    // Toggle theme
    themeToggleBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      document.body.classList.toggle('dark');
    });
    
    // Tab switching
    sendTab.addEventListener('click', () => {
      sendTab.classList.add('border-primary');
      contractTab.classList.remove('border-primary');
      historyTab.classList.remove('border-primary');
      sendTab.setAttribute('aria-selected', 'true');
      contractTab.setAttribute('aria-selected', 'false');
      historyTab.setAttribute('aria-selected', 'false');
      
      sendPanel.classList.remove('hidden');
      contractPanel.classList.add('hidden');
      historyPanel.classList.add('hidden');
    });
    
    contractTab.addEventListener('click', () => {
      sendTab.classList.remove('border-primary');
      contractTab.classList.add('border-primary');
      historyTab.classList.remove('border-primary');
      sendTab.setAttribute('aria-selected', 'false');
      contractTab.setAttribute('aria-selected', 'true');
      historyTab.setAttribute('aria-selected', 'false');
      
      sendPanel.classList.add('hidden');
      contractPanel.classList.remove('hidden');
      historyPanel.classList.add('hidden');
    });
    
    historyTab.addEventListener('click', () => {
      sendTab.classList.remove('border-primary');
      contractTab.classList.remove('border-primary');
      historyTab.classList.add('border-primary');
      sendTab.setAttribute('aria-selected', 'false');
      contractTab.setAttribute('aria-selected', 'false');
      historyTab.setAttribute('aria-selected', 'true');
      
      sendPanel.classList.add('hidden');
      contractPanel.classList.add('hidden');
      historyPanel.classList.remove('hidden');
      
      displayTransactions();
    });
    
    // Modal controls
    closeModalBtn.addEventListener('click', hideModal);
    modalOkBtn.addEventListener('click', hideModal);
    
    // Display transaction history
    function displayTransactions() {
      const transactionsContainer = document.getElementById('transactions');
      transactionsContainer.innerHTML = '';
      
      if (allTransactions.length === 0) {
        transactionsContainer.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-4">No transactions found.</p>';
        return;
      }
      
      allTransactions.forEach(tx => {
        const txElement = document.createElement('div');
        txElement.className = 'p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center';
        
        let icon, colorClass;
        switch(tx.type) {
          case 'incoming':
            icon = '↓';
            colorClass = 'text-green-500';
            break;
          case 'outgoing':
            icon = '↑';
            colorClass = 'text-red-500';
            break;
          case 'contract':
            icon = '⚙️';
            colorClass = 'text-blue-500';
            break;
          default:
            icon = '•';
            colorClass = 'text-gray-500';
        }
        
        txElement.innerHTML = `
          <div class="flex items-center">
            <div class="mr-3 ${colorClass} text-lg font-bold">${icon}</div>
            <div class="text-sm">
              <div class="font-medium">${shortenAddress(tx.to)}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">${tx.date}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-medium ${colorClass}">${tx.amount} ETH</div>
          </div>
        `;
        
        transactionsContainer.appendChild(txElement);
      });
    }
    
    // Connect wallet
    async function toggleWallet() {
      if (!connected) {
        const passwordVerified = await verifyPassword();
        if (!passwordVerified) return;
        
        try {
          showLoading();
          
          if (window.ethereum) {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            account = await signer.getAddress();
            
            // Initialize contract
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            
            updateStatus(`Connected: ${shortenAddress(account)}`, true);
            walletButton.innerHTML = '<span class="mr-2">❌</span> Disconnect Wallet';
            connected = true;
            
            // Enable buttons
            sendBtn.disabled = false;
            withdrawBtn.disabled = false;
            sendContractBtn.disabled = false;
          } else {
            showModal("Error", "Please install MetaMask to connect your wallet.");
          }
        } catch (error) {
          console.error("Connection error:", error);
          showModal("Connection Error", error.message || "Failed to connect wallet");
        } finally {
          hideLoading();
        }
      } else {
        // "Disconnect" wallet (simulate disconnect)
        provider = null;
        signer = null;
        contract = null;
        account = null;
        connected = false;
        
        updateStatus("Not connected");
        walletButton.innerHTML = '<span class="mr-2">🔌</span> Connect Wallet';
        
        // Disable buttons
        sendBtn.disabled = true;
        withdrawBtn.disabled = true;
        sendContractBtn.disabled = true;
      }
    }
    
    // Send ETH directly from wallet to wallet
    async function sendEth() {
      if (!connected) {
        showModal("Error", "Please connect your wallet first");
        return;
      }
      
      const recipient = recipientInput.value.trim();
      const amount = amountInput.value.trim();
      
      if (!ethers.utils.isAddress(recipient)) {
        showModal("Error", "Invalid recipient address");
        return;
      }
      
      if (isNaN(amount) || parseFloat(amount) <= 0) {
        showModal("Error", "Please enter a valid amount");
        return;
      }
      
      try {
        showLoading();
        
        // Send ETH directly from user's wallet
        const tx = await signer.sendTransaction({
          to: recipient,
          value: ethers.utils.parseEther(amount)
        });
        
        // Wait for transaction
        await tx.wait();
        
        // Add to transaction history
        allTransactions.unshift({
          to: recipient,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          type: 'outgoing'
        });
        
        showModal("Success", `Successfully sent ${amount} ETH to ${shortenAddress(recipient)}`);
        
        // Clear inputs
        recipientInput.value = '';
        amountInput.value = '';
        
      } catch (error) {
        console.error("Transaction error:", error);
        showModal("Transaction Error", error.message || "Failed to send ETH");
      } finally {
        hideLoading();
      }
    }
    
    // Withdraw funds from contract
    async function withdrawFunds() {
      if (!connected || !contract) {
        showModal("Error", "Please connect your wallet first");
        return;
      }
      
      try {
        showLoading();
        
        const tx = await contract.withdraw(ethers.utils.parseEther("0.01"));
        await tx.wait();
        
        // Add to transaction history
        allTransactions.unshift({
          to: account,
          amount: "0.01",
          date: new Date().toISOString().split('T')[0],
          type: 'contract'
        });
        
        showModal("Success", "Successfully withdrew 0.01 ETH from the contract");
        
      } catch (error) {
        console.error("Withdrawal error:", error);
        showModal("Withdrawal Error", error.message || "Failed to withdraw funds");
      } finally {
        hideLoading();
      }
    }
    
    // Send funds from contract
    async function sendFundsFromContract() {
      if (!connected || !contract) {
        showModal("Error", "Please connect your wallet first");
        return;
      }
      
      const recipient = contractRecipientInput.value.trim();
      const amount = contractAmountInput.value.trim();
      
      if (!ethers.utils.isAddress(recipient)) {
        showModal("Error", "Invalid recipient address");
        return;
      }
      
      if (isNaN(amount) || parseFloat(amount) <= 0) {
        showModal("Error", "Please enter a valid amount");
        return;
      }
      
      try {
        showLoading();
        
        const tx = await contract.sendFunds(recipient, ethers.utils.parseEther(amount));
        await tx.wait();
        
        // Add to transaction history
        allTransactions.unshift({
          to: recipient,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          type: 'contract'
        });
        
        showModal("Success", `Successfully sent ${amount} ETH from contract to ${shortenAddress(recipient)}`);
        
        // Clear inputs
        contractRecipientInput.value = '';
        contractAmountInput.value = '';
        
      } catch (error) {
        console.error("Contract transaction error:", error);
        showModal("Transaction Error", error.message || "Failed to send funds from contract");
      } finally {
        hideLoading();
      }
    }
    
    // Download transaction history
    async function downloadTransactions() {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Transaction Receipt", 15, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 30);
        doc.line(15, 32, 195, 32);
        
        let y = 40;
        allTransactions.forEach((tx, i) => {
          doc.setFont("helvetica", "bold");
          doc.text(`Transaction #${i + 1}`, 15, y);
          doc.setFont("helvetica", "normal");
          doc.text(`To Address : ${tx.to}`, 20, y + 8);
          doc.text(`Amount     : ${tx.amount} ETH`, 20, y + 16);
          doc.text(`Date       : ${tx.date}`, 20, y + 24);
          doc.text(`Type       : ${tx.type}`, 20, y + 32);
          doc.line(15, y + 40, 195, y + 40);
          y += 48;
          
          // Auto add new page if needed
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        });
        
        doc.save("All_Transactions.pdf");
      } catch (error) {
        console.error("Download error:", error);
        showModal("Download Error", "Failed to download transaction history");
      }
    }
    
    // Background animation
    const bg = document.getElementById("animated-background");
    document.addEventListener("mousemove", (e) => {
      if (window.innerWidth > 768) {  // Only on desktop
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        bg.style.transform = `translate(${x}px, ${y}px) scale(1.02)`;
      }
    });
    
    // Event Listeners
    walletButton.addEventListener('click', toggleWallet);
    sendBtn.addEventListener('click', sendEth);
    withdrawBtn.addEventListener('click', withdrawFunds);
    sendContractBtn.addEventListener('click', sendFundsFromContract);
    downloadBtn.addEventListener('click', downloadTransactions);
    refreshHistoryBtn.addEventListener('click', displayTransactions);
    
    // Initialize app
    passwordModal.classList.add('hidden');  // Hide password modal initially
    displayTransactions();
  });


// Include Ethers.js in your HTML: <script src="https://cdn.jsdelivr.net/npm/ethers/dist/ethers.min.js"></script>

let provider;
let signer;

async function connectWallet() {
  if (typeof window.ethereum !== "undefined") {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      updateBalance();
    } catch (err) {
      console.error("User denied wallet connection", err);
    }
  } else {
    alert("Please install MetaMask.");
  }
}

async function updateBalance() {
  try {
    if (!signer) {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
    }
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const ethBalance = ethers.utils.formatEther(balance);
    document.getElementById("account-balance").textContent = `${parseFloat(ethBalance).toFixed(4)} ETH`;
  } catch (err) {
    console.error("Error fetching balance:", err);
  }
}

document.getElementById("refresh-balance").addEventListener("click", updateBalance);

const allTransactions = [
  { to: "0x52676f0b841d7b40740ced9a218de532da9ba640", amount: "0.01", date: "2025-04-30" },
  { to: "0xbdD7894608cF5fF110e3E7b2C398e6FACD9a5dBC", amount: "0.01", date: "2025-04-30" },
  { to: "0xbdD7894608cF5fF110e3E7b2C398e6FACD9a5dBC", amount: "0.01", date: "2025-04-30" },
  { to: "0x52676f0b841d7b40740ced9a218de532da9ba640", amount: "0.01", date: "2025-04-30" },
  { to: "0xbdD7894608cF5fF110e3E7b2C398e6FACD9a5dBC", amount: "0.01", date: "2025-04-30" },
  { to: "0x52676f0b841d7b40740ced9a218de532da9ba640", amount: "0.01", date: "2025-04-30" },
  { to: "0xbdD7894608cF5fF110e3E7b2C398e6FACD9a5dBC", amount: "0.01", date: "2025-04-30" },
  { to: "0xbdD7894608cF5fF110e3E7b2C398e6FACD9a5dBC", amount: "0.01", date: "2025-04-29" },
  { to: "0x52676f0b841d7b40740ced9a218de532da9ba640", amount: "0.01", date: "2025-04-29" },
];


async function downloadTransactions() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(" Transaction Receipt", 15, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 30);
  doc.line(15, 32, 195, 32);

  let y = 40;
  allTransactions.forEach((tx, i) => {
    doc.setFont("helvetica", "bold");
    doc.text(`Transaction #${i + 1}`, 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(`To Address : ${tx.to}`, 20, y + 8);
    doc.text(`Amount     : ${tx.amount} ETH`, 20, y + 16);
    doc.text(`Date       : ${tx.date}`, 20, y + 24);
    doc.line(15, y + 30, 195, y + 30);
    y += 38;

    // Auto add new page if needed
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("All_Transactions.pdf");
}