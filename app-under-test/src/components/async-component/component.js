/**
 * Async Chart Component
 * Demonstrates delayed Shadow DOM attachment (2000ms)
 */
class AsyncChart extends HTMLElement {
  constructor() {
    super();
    // Do NOT attach shadow here - will be done asynchronously
  }

  connectedCallback() {
    // Simulate async loading with 2000ms delay
    setTimeout(() => {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
          }
          .chart {
            width: 100%;
            height: 300px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
          }
          svg {
            width: 200px;
            height: 200px;
          }
        </style>
        <div class="chart" role="img" aria-label="Sales Chart">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="80" width="30" height="100" fill="rgba(255,255,255,0.8)" />
            <rect x="60" y="50" width="30" height="130" fill="rgba(255,255,255,0.8)" />
            <rect x="100" y="30" width="30" height="150" fill="rgba(255,255,255,0.8)" />
            <rect x="140" y="60" width="30" height="120" fill="rgba(255,255,255,0.8)" />
          </svg>
        </div>
      `;
    }, 2000);
  }
}

customElements.define('async-chart', AsyncChart);
