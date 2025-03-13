// File: frontend/src/scripts/dom/main.ts

function createModal() {
	const modalOverlay = document.createElement('div');
	modalOverlay.classList.add('modal-overlay', 'show');

	const modalContent = document.createElement('div');
	modalContent.classList.add('modal-content');
	modalContent.innerHTML = `
        <h2 class="modal-title">Dynamically Created Modal</h2>
        <p>This was built dynamically using createElement.</p>
        <button id="close-modal" class="modal-close-btn">Close</button>
    `;

	modalOverlay.appendChild(modalContent);
	document.body.appendChild(modalOverlay);

	document.getElementById('close-modal')!.addEventListener('click', () => {
		modalOverlay.remove();
	});
}

function injectTemplate() {
	const template = document.getElementById('modal-template') as HTMLTemplateElement;
	if (!template?.content) {
		console.error('Template not found or invalid!');
		return;
	}

	const clone = template.content.cloneNode(true) as DocumentFragment;
	const modalElement = clone.querySelector('.modal-overlay') as HTMLElement;

	if (!modalElement) {
		console.error('Modal element not found inside template!');
		return;
	}

	document.body.appendChild(modalElement);

	const closeButton = modalElement.querySelector('.modal-close-btn');
	if (closeButton) {
		closeButton.addEventListener('click', () => {
			modalElement.remove();
		});
	} else {
		console.error('Close button not found!');
	}
}

async function loadComponent(url: string, containerId: string): Promise<void> {
	const response = await fetch(url);
	const html = await response.text();

	document.getElementById(containerId)!.innerHTML = html;
}

function showModal(): void {
	const modal = document.createElement('div');

	modal.classList.add('modal-overlay');
	modal.innerHTML = `
        <div class="modal-content">
            <h2>Dynamic Modal</h2>
            <button id="close-modal">Close</button>
        </div>
    `;
	document.body.appendChild(modal);

	modal.querySelector('#close-modal')!.addEventListener('click', () => {
		modal.remove();
	});
}

export { createModal, injectTemplate, loadComponent, showModal };
