/**
 * Nested Form Components
 * Demonstrates 3 levels of Shadow DOM nesting
 * Structure: my-app → my-layout → my-form-container → my-form
 */

// Level 0: Root app component
class MyApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 1rem;
        }
      </style>
      <my-layout></my-layout>
    `;
  }
}

// Level 1: Layout component
class MyLayout extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border: 1px solid #ddd;
          padding: 1rem;
        }
      </style>
      <my-form-container></my-form-container>
    `;
  }
}

// Level 2: Form container component
class MyFormContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: #f9f9f9;
          padding: 1rem;
        }
      </style>
      <my-form></my-form>
    `;
  }
}

// Level 3: Form component with input
class MyForm extends HTMLElement {
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
        form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        label {
          font-weight: bold;
        }
        input {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
      </style>
      <form>
        <label for="email">Email:</label>
        <input type="email" name="email" id="email" placeholder="Enter your email" />
      </form>
    `;
  }
}

// Register all components
customElements.define('my-app', MyApp);
customElements.define('my-layout', MyLayout);
customElements.define('my-form-container', MyFormContainer);
customElements.define('my-form', MyForm);
