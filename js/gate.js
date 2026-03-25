/**
 * gate.js — Password gate for PCI research volumes
 * Uses Web Crypto API (SHA-256) + sessionStorage.
 * Password only needs to be entered once per browser session.
 */
(function () {
  const HASH = '6b53bc225e0aae1d798f348e41b1801dfab38c61af69b5f657e8eae2cffd9ad1';
  const SESSION_KEY = 'pci_auth';

  // Already authenticated this session
  if (sessionStorage.getItem(SESSION_KEY) === '1') return;

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    #pci-gate {
      position: fixed; inset: 0; z-index: 9999;
      background: #111111;
      display: flex; align-items: center; justify-content: center;
      font-family: 'DM Sans', sans-serif;
    }
    #pci-gate-box {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      padding: 2.5rem 2.8rem;
      max-width: 420px; width: 90%;
      text-align: center;
    }
    #pci-gate-box .gate-logo {
      font-family: 'Playfair Display', serif;
      font-size: 1.6rem; font-weight: 700;
      color: #f5f5f5; margin-bottom: 0.2rem;
      letter-spacing: 1px;
    }
    #pci-gate-box .gate-logo span { color: #CC5200; }
    #pci-gate-box .gate-sub {
      color: #888; font-size: 0.82rem;
      margin-bottom: 1.8rem;
    }
    #pci-gate-box label {
      display: block; text-align: left;
      color: #aaa; font-size: 0.8rem;
      text-transform: uppercase; letter-spacing: 0.08em;
      margin-bottom: 0.4rem;
    }
    #pci-gate-box input[type="password"] {
      width: 100%; box-sizing: border-box;
      background: #111; border: 1px solid #333;
      border-radius: 4px; padding: 0.65rem 0.9rem;
      color: #f5f5f5; font-size: 1rem;
      outline: none; transition: border-color 0.2s;
      margin-bottom: 1rem;
    }
    #pci-gate-box input[type="password"]:focus { border-color: #CC5200; }
    #pci-gate-box button {
      width: 100%;
      background: #CC5200; color: #fff;
      border: none; border-radius: 4px;
      padding: 0.7rem 1rem; font-size: 0.95rem;
      font-weight: 600; cursor: pointer;
      transition: background 0.2s;
    }
    #pci-gate-box button:hover { background: #FF6B00; }
    #pci-gate-error {
      display: none; margin-top: 0.85rem;
      color: #e05252; font-size: 0.82rem;
    }
    #pci-gate-box .gate-note {
      margin-top: 1.4rem; color: #555;
      font-size: 0.75rem; line-height: 1.5;
    }
  `;
  document.head.appendChild(style);

  // Inject HTML
  const gate = document.createElement('div');
  gate.id = 'pci-gate';
  gate.innerHTML = `
    <div id="pci-gate-box">
      <div class="gate-logo">PCI<span>.</span></div>
      <div class="gate-sub">Private Credit Index — Research Volumes</div>
      <label for="pw-input">Access Password</label>
      <input type="password" id="pw-input" placeholder="Enter password" autocomplete="off"/>
      <button id="pw-submit">Enter</button>
      <div id="pci-gate-error">Incorrect password. Please try again.</div>
      <div class="gate-note">
        This research is password-protected independent work.<br>
        For access, contact the author directly.
      </div>
    </div>
  `;
  document.body.prepend(gate);

  // Allow Enter key to submit
  document.getElementById('pw-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('pw-submit').click();
  });

  // Submit handler
  document.getElementById('pw-submit').addEventListener('click', async function () {
    const val = document.getElementById('pw-input').value;
    if (!val) return;

    const encoded = new TextEncoder().encode(val);
    const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
    const hashHex = Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === HASH) {
      sessionStorage.setItem(SESSION_KEY, '1');
      document.getElementById('pci-gate').remove();
    } else {
      document.getElementById('pci-gate-error').style.display = 'block';
      document.getElementById('pw-input').value = '';
      document.getElementById('pw-input').focus();
    }
  });

  // Auto-focus
  window.addEventListener('DOMContentLoaded', function () {
    const el = document.getElementById('pw-input');
    if (el) el.focus();
  });
})();
