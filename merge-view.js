import { LitElement, html, css } from 'lit';

export class MergeView extends LitElement {
    static styles = css`
        :host {
            display: block;
            height: 100%;
        }
        .merge-view {
            height: 100%;
            border: 1px solid #ccc;
        }
        :host ::part(CodeMirror) {
            height: 100% !important;
        }
        /* Ensure copy buttons are visible */
        :host .CodeMirror-merge-copy {
            display: block !important;
        }
        :host .CodeMirror-merge-copy-reverse {
            display: block !important;
        }
    `;

    static properties = {
        leftText: { type: String },
        rightText: { type: String }
    };

    constructor() {
        super();
        this.leftText = '';
        this.rightText = '';
        this.mergeView = null;
        this._ignoreLeftChange = false;
        this._ignoreRightChange = false;
    }

    createRenderRoot() {
        const root = super.createRenderRoot();
        // Add CodeMirror styles to shadow root
        const linkElem = document.createElement('link');
        linkElem.rel = 'stylesheet';
        linkElem.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css';
        root.appendChild(linkElem);

        const mergeCssElem = document.createElement('link');
        mergeCssElem.rel = 'stylesheet';
        mergeCssElem.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/merge/merge.min.css';
        root.appendChild(mergeCssElem);
        
        return root;
    }

    firstUpdated() {
        // Ensure CodeMirror is available
        if (typeof CodeMirror === 'undefined') {
            console.error('CodeMirror is not loaded');
            return;
        }
        this.initializeMergeView();
    }

    updated(changedProperties) {
        if (!this.mergeView) return;

        const mv = this.mergeView;
        if (changedProperties.has('leftText') && !this._ignoreLeftChange) {
            const cursor = mv.edit.getCursor();
            mv.edit.setValue(this.leftText);
            mv.edit.setCursor(cursor);
        }
        if (changedProperties.has('rightText') && !this._ignoreRightChange) {
            const cursor = mv.right.edit.getCursor();
            mv.right.edit.setValue(this.rightText);
            mv.right.edit.setCursor(cursor);
        }
    }

    initializeMergeView() {
        const mergeViewElement = this.shadowRoot.querySelector('.merge-view');
        if (!mergeViewElement) {
            console.error('Merge view element not found');
            return;
        }

        try {
            this.mergeView = CodeMirror.MergeView(mergeViewElement, {
                value: this.leftText,
                orig: this.rightText,
                lineNumbers: true,
                mode: 'javascript',
                highlightDifferences: true,
                connect: true,
                collapseIdentical: false,
                allowEditingOriginals: true,
                revertButtons: true,
                showDifferences: true
            });

            // Add part attribute to CodeMirror elements for styling
            const cmElements = this.shadowRoot.querySelectorAll('.CodeMirror');
            cmElements.forEach(el => el.setAttribute('part', 'CodeMirror'));

            // Handle window resize
            window.addEventListener('resize', () => {
                if (this.mergeView) {
                    this.mergeView.edit.refresh();
                    this.mergeView.right.edit.refresh();
                }
            });

            // Add change handlers to keep properties in sync
            this.mergeView.edit.on('change', () => {
                if (this._ignoreLeftChange) return;
                this._ignoreLeftChange = true;
                this.leftText = this.mergeView.edit.getValue();
                this.dispatchEvent(new CustomEvent('left-changed', { detail: this.leftText }));
                this._ignoreLeftChange = false;
            });

            this.mergeView.right.edit.on('change', () => {
                if (this._ignoreRightChange) return;
                this._ignoreRightChange = true;
                this.rightText = this.mergeView.right.edit.getValue();
                this.dispatchEvent(new CustomEvent('right-changed', { detail: this.rightText }));
                this._ignoreRightChange = false;
            });

        } catch (error) {
            console.error('Error initializing merge view:', error);
        }
    }

    render() {
        return html`
            <div class="merge-view"></div>
        `;
    }
}

customElements.define('merge-view', MergeView);
