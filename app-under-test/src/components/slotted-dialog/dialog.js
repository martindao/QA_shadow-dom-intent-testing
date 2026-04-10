/**
 * Slotted Dialog Component
 * Demonstrates slot-based content projection in Shadow DOM
 */
class SlottedDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .dialog {
          border: 1px solid #ccc;
          padding: 1rem;
          background: white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h2 {
          margin: 0 0 0.5rem 0;
        }
        .content {
          margin-bottom: 1rem;
        }
        button {
          padding: 0.5rem 1rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background: #0056b3;
        }
      </style>
      <div class="dialog" role="dialog" aria-modal="true">
        <h2><slot name="title">Default Title</slot></h2>
        <div class="content"><slot name="content"></slot></div>
        <button id="confirm-btn" role="button">Confirm</button>
      </div>
    `;
  }
}

customElements.define('slotted-dialog', SlottedDialog);
