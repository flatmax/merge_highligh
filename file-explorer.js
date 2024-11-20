import { LitElement, html, css } from 'lit';

export class FileExplorer extends LitElement {
    static styles = css`
        :host {
            display: block;
            background: #f5f5f5;
            padding: 10px;
            height: 100%;
            overflow: auto;
        }
        .file-tree {
            font-family: Arial, sans-serif;
            font-size: 14px;
        }
        .item {
            padding: 4px 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            border-radius: 4px;
        }
        .item:hover {
            background: #e0e0e0;
        }
        .item.selected {
            background: #2196f3;
            color: white;
        }
        .folder {
            font-weight: bold;
        }
        .folder::before {
            content: "📁";
            margin-right: 5px;
        }
        .file::before {
            content: "📄";
            margin-right: 5px;
        }
    `;

    static properties = {
        items: { type: Array },
        selectedPath: { type: String },
        currentPath: { type: String }
    };

    constructor() {
        super();
        this.items = [];
        this.selectedPath = '';
        this.currentPath = '';
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDirectory();
    }

    async loadDirectory(path = '') {
        try {
            const response = await fetch(`http://localhost:3000/api/files/list?path=${encodeURIComponent(path)}`);
            const data = await response.json();
            if (data.error) {
                console.error('Error loading directory:', data.error);
                return;
            }
            this.items = data;
            this.currentPath = path;
        } catch (error) {
            console.error('Error loading directory:', error);
        }
    }

    async handleItemClick(item) {
        if (item.type === 'directory') {
            const newPath = item.path;
            await this.loadDirectory(newPath);
        } else {
            this.selectedPath = item.path;
            try {
                const response = await fetch(`http://localhost:3000/api/files/read?path=${encodeURIComponent(item.path)}`);
                const data = await response.json();
                if (data.error) {
                    console.error('Error reading file:', data.error);
                    return;
                }
                // Dispatch event with file content
                this.dispatchEvent(new CustomEvent('file-selected', {
                    detail: {
                        path: item.path,
                        content: data.content
                    }
                }));
            } catch (error) {
                console.error('Error reading file:', error);
            }
        }
    }

    render() {
        return html`
            <div class="file-tree">
                ${this.currentPath ? html`
                    <div class="item folder" @click=${() => this.loadDirectory(
                        this.currentPath.split('/').slice(0, -1).join('/')
                    )}>
                        ..
                    </div>
                ` : ''}
                ${this.items.map(item => html`
                    <div class="item ${item.type} ${item.path === this.selectedPath ? 'selected' : ''}"
                         @click=${() => this.handleItemClick(item)}>
                        ${item.name}
                    </div>
                `)}
            </div>
        `;
    }
}

customElements.define('file-explorer', FileExplorer);
