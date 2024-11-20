import { LitElement, html, css } from 'lit';

export class MergeView extends LitElement {
    static styles = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
            box-sizing: border-box;
        }
        .merge-view {
            height: 100%;
            width: 100%;
            box-sizing: border-box;
        }
        :host ::part(CodeMirror) {
            height: 100% !important;
            width: auto !important;
            position: absolute !important;
        }
        /* Ensure copy buttons are visible */
        :host .CodeMirror-merge-copy {
            display: block !important;
        }
        :host .CodeMirror-merge-copy-reverse {
            display: block !important;
        }
        /* Fix sizing of merge view wrapper */
        :host .CodeMirror-merge {
            height: 100%;
        }
        :host .CodeMirror-merge, 
        :host .CodeMirror-merge .CodeMirror {
            height: 100%;
        }
        :host .CodeMirror-merge-pane {
            height: 100%;
        }
        :host .CodeMirror-merge-r-chunk { 
            background: #ffd7d7;
        }
        :host .CodeMirror-merge-r-chunk-start {
            border-top: 1px solid #faa;
        }
        :host .CodeMirror-merge-r-chunk-end {
            border-bottom: 1px solid #faa;
        }
        :host .CodeMirror-merge-r-connect {
            fill: #ffd7d7;
            stroke: #faa;
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
        this._resizeObserver = null;
    }

    detectLanguage(code) {
        if (!code) return 'javascript'; // default
        
        // Common patterns for language detection
        const patterns = {
            python: /^(def|class|import|from|if __name__|print)\b|\.py$/i,
            javascript: /^(function|const|let|var|import|class)\b|\.js$/i,
            html: /^<!DOCTYPE|<html|<head|<body|\.html$/i,
            css: /^(\.|#|@media|@import)|{|}|\.css$/i,
            java: /^(public|private|protected|class|interface|enum)\b|\.java$/i,
            cpp: /^(#include|using namespace|int main|class.*{)|\.cpp$/i,
            ruby: /^(def|class|require|module|gem)\b|\.rb$/i,
            php: /^(<\?php|\$[a-zA-Z_]|function|class|namespace)\b|\.php$/i
        };

        // Check each pattern
        for (const [lang, pattern] of Object.entries(patterns)) {
            if (pattern.test(code)) {
                return lang;
            }
        }

        return 'javascript'; // fallback
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
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
        this.setupResizeObserver();
    }

    setupResizeObserver() {
        // Create ResizeObserver to handle container size changes
        this._resizeObserver = new ResizeObserver(() => {
            if (this.mergeView) {
                this.mergeView.edit.refresh();
                this.mergeView.right.edit.refresh();
                
                // Force recomputation of merge view layout
                const wrapper = this.shadowRoot.querySelector('.CodeMirror-merge');
                if (wrapper) {
                    wrapper.style.height = '100%';
                    this.mergeView.edit.setSize(null, '100%');
                    this.mergeView.right.edit.setSize(null, '100%');
                }
            }
        });

        // Observe both the host element and the merge-view container
        this._resizeObserver.observe(this);
        const mergeViewElement = this.shadowRoot.querySelector('.merge-view');
        if (mergeViewElement) {
            this._resizeObserver.observe(mergeViewElement);
        }
    }

    updated(changedProperties) {
        if (!this.mergeView) return;

        const mv = this.mergeView;
        if (changedProperties.has('leftText') && !this._ignoreLeftChange) {
            const cursor = mv.edit.getCursor();
            mv.edit.setValue(this.leftText);
            mv.edit.setCursor(cursor);
            // Update mode based on new content
            const detectedMode = this.detectLanguage(this.leftText);
            mv.edit.setOption('mode', detectedMode);
            mv.right.edit.setOption('mode', detectedMode);
        }
        if (changedProperties.has('rightText') && !this._ignoreRightChange) {
            const cursor = mv.right.edit.getCursor();
            mv.right.edit.setValue(this.rightText);
            mv.right.edit.setCursor(cursor);
            // Update mode if right side changed and left is empty
            if (!this.leftText) {
                const detectedMode = this.detectLanguage(this.rightText);
                mv.edit.setOption('mode', detectedMode);
                mv.right.edit.setOption('mode', detectedMode);
            }
        }
    }

    initializeMergeView() {
        const mergeViewElement = this.shadowRoot.querySelector('.merge-view');
        if (!mergeViewElement) {
            console.error('Merge view element not found');
            return;
        }

        try {
            // Detect initial language mode
            const detectedMode = this.detectLanguage(this.leftText || this.rightText);
            
            this.mergeView = CodeMirror.MergeView(mergeViewElement, {
                value: this.leftText,
                orig: this.rightText,
                lineNumbers: true,
                mode: detectedMode,
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

            // Initial size adjustment
            this.mergeView.edit.setSize(null, '100%');
            this.mergeView.right.edit.setSize(null, '100%');

            // Add change handlers to keep properties in sync
            this.mergeView.edit.on('change', () => {
                if (this._ignoreLeftChange) return;
                this._ignoreLeftChange = true;
                this.leftText = this.mergeView.edit.getValue();
                // Update mode based on content
                const detectedMode = this.detectLanguage(this.leftText);
                this.mergeView.edit.setOption('mode', detectedMode);
                this.mergeView.right.edit.setOption('mode', detectedMode);
                this.dispatchEvent(new CustomEvent('left-changed', { detail: this.leftText }));
                this._ignoreLeftChange = false;
            });

            this.mergeView.right.edit.on('change', () => {
                if (this._ignoreRightChange) return;
                this._ignoreRightChange = true;
                this.rightText = this.mergeView.right.edit.getValue();
                // Update mode if left side is empty
                if (!this.leftText) {
                    const detectedMode = this.detectLanguage(this.rightText);
                    this.mergeView.edit.setOption('mode', detectedMode);
                    this.mergeView.right.edit.setOption('mode', detectedMode);
                }
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
