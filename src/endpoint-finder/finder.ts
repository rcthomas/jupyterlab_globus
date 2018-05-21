import {
    Widget
} from '@phosphor/widgets';

import {GLOBUS_TRANSFER_API_URL, LOADING_ICON} from "../index";


/**
 * Widget for hosting the Globus Endpoint Finder.
 */
export class GlobusEndpointFinder extends Widget {
    private searchResults: HTMLUListElement;
    private searchInput: HTMLInputElement;

    constructor() {
        super();
        this.id = 'globus-endpoint-finder';

        // Add Tab Title
        this.title.label = 'Endpoint Finder';
        this.title.closable = true;

        this.searchResults = document.createElement('ul');
        this.searchResults.className = 'result-list';

        this.searchInput = document.createElement('input');
        this.searchInput.placeholder = 'Search endpoints';
        this.searchInput.className = 'search-input';
        this.searchInput.addEventListener('keyup', () => this.searchEndPoints());

        this.node.appendChild(this.searchInput);
        this.node.appendChild(this.searchResults);
    }

    private searchEndPoints() {
        let that = this;
        fetch(`${GLOBUS_TRANSFER_API_URL}/endpoint_search?filter_fulltext=${this.searchInput.value}`, {
            method: 'GET',
            headers: {'Authorization': 'Bearer Ag34bvav1Xg2OYOqm1JmanKmQzx9z59nWM8gpejW9w9yPYyX0qsVCVDEnQW3VEb5PpBjVNBJvbQ8n9fXqyPPqSdl0P'}
        }).then(response => {
            return response.json();
        }).then(data => {
            this.searchResults.innerHTML = "";
            for (let i = 0; i < data.DATA.length; i++) {
                // Create endPoint tag
                let endPoint: HTMLLIElement = document.createElement('li');
                endPoint.className = 'accordion';
                endPoint.textContent = `${data.DATA[i].display_name}\nOwner: ${data.DATA[i].owner_string}`;

                // Hide/Show directories when EP is clicked
                endPoint.addEventListener("click", async function() {
                    this.classList.toggle("active");

                    // If directories don't exist, fetch them
                    if (!this.firstElementChild) {
                        endPoint.appendChild(LOADING_ICON);
                        await that.fetchDirectories(endPoint, data.DATA[i].id);
                        endPoint.removeChild(LOADING_ICON);
                    }

                    let directories = this.firstElementChild;

                    if (directories.hasAttribute('hidden')) {
                        directories.removeAttribute('hidden');
                    }
                    else {
                        directories.setAttribute('hidden', "");
                    }
                });
                this.searchResults.appendChild(endPoint);
            }
        });
    }

    private async fetchDirectories(endPoint: HTMLElement, endPointId: string) {
        // Activate endpoint fetch -> "autoactivate"
        let fetchEP: Promise<any> = new Promise<any>((resolve) => fetch(`${GLOBUS_TRANSFER_API_URL}/endpoint/${endPointId}/autoactivate`, {
            method: 'POST',
            headers: {'Authorization': 'Bearer Ag34bvav1Xg2OYOqm1JmanKmQzx9z59nWM8gpejW9w9yPYyX0qsVCVDEnQW3VEb5PpBjVNBJvbQ8n9fXqyPPqSdl0P'},
            body: ''
        }).then(async function () {
            // Fetch endpoint directories
            let fetchEPDirectories: Promise<any> = new Promise<any>((resolve) => fetch(`${GLOBUS_TRANSFER_API_URL}/endpoint/${endPointId}/ls?path=/~/`, {
                method: 'GET',
                headers: {'Authorization': 'Bearer Ag34bvav1Xg2OYOqm1JmanKmQzx9z59nWM8gpejW9w9yPYyX0qsVCVDEnQW3VEb5PpBjVNBJvbQ8n9fXqyPPqSdl0P'},
            }).then(response => {
                return response.json();
            }).then(data => {
                let directories: HTMLUListElement = document.createElement('ul');
                directories.className = 'panel';
                directories.hidden = true;
                // Add directories if they were retrieved/user has permission
                if (data.DATA) {
                    for (let i = 0; i < data.DATA.length; i++) {
                        let directory: HTMLLIElement = document.createElement('li');
                        directory.textContent = `${data.DATA[i].name}\nType: ${data.DATA[i].type}`;
                        directories.appendChild(directory);
                    }
                }
                else {
                    directories.innerText = "You don't have permission to see these"
                }

                endPoint.appendChild(directories);

                resolve();
            }));

            await fetchEPDirectories;
            resolve();
        }));

        await fetchEP;
    }
}