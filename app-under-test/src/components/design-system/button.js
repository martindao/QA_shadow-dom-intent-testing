/**
 * Design System Button Component
 * Reusable button Web Component
 */
class DSButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const variant = this.getAttribute('variant') || 'primary';
    const disabled = this.hasAttribute('disabled');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.2s;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        button.primary {
          background: #007bff;
          color: white;
        }
        button.primary:hover:not(:disabled) {
          background: #0056b3;
        }
        button.secondary {
          background: #6c757d;
          color: white;
        }
        button.secondary:hover:not(:disabled) {
          background: #545b62;
        }
      </style>
      <button class="${variant}" ${disabled ? 'disabled' : ''}>
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('ds-button', DSButton);
