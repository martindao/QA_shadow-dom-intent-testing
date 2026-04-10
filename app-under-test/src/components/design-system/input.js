/**
 * Design System Input Component
 * Reusable input Web Component
 */
class DSInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const type = this.getAttribute('type') || 'text';
    const name = this.getAttribute('name') || '';
    const placeholder = this.getAttribute('placeholder') || '';
    const disabled = this.hasAttribute('disabled');
    const required = this.hasAttribute('required');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 0.5rem;
        }
        label {
          display: block;
          margin-bottom: 0.25rem;
          font-weight: bold;
        }
        input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
        }
        input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
        input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }
      </style>
      <label>
        <slot name="label"></slot>
      </label>
      <input
        type="${type}"
        name="${name}"
        placeholder="${placeholder}"
        ${disabled ? 'disabled' : ''}
        ${required ? 'required' : ''}
      />
    `;
  }
}

customElements.define('ds-input', DSInput);
