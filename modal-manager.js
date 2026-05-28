(function () {
    const HASHED_MODALS = new Set(['about', 'gallery', 'contacts']);
    const activeStack = [];
    let previousFocus = null;

    function getModal(name) {
        return document.querySelector(`.modal[data-modal="${name}"]`);
    }

    function getTopModal() {
        return activeStack[activeStack.length - 1] || null;
    }

    function getFocusable(modal) {
        return modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    }

    function setHash(name) {
        if (!HASHED_MODALS.has(name)) return;
        const nextHash = `#${name}`;
        if (window.location.hash !== nextHash) {
            history.pushState(null, '', nextHash);
        }
    }

    function clearHash(name) {
        if (!HASHED_MODALS.has(name)) return;
        if (window.location.hash === `#${name}`) {
            history.pushState(null, '', window.location.pathname + window.location.search);
        }
    }

    function syncBodyState() {
        document.body.classList.toggle('modal-open', activeStack.length > 0);
    }

    function open(name, options = {}) {
        const modal = getModal(name);
        if (!modal) return;

        const shouldStack = options.stack ?? !HASHED_MODALS.has(name);
        if (!shouldStack) closeAll({ updateHash: false, restoreFocus: false });

        if (!activeStack.includes(modal)) {
            if (!previousFocus) previousFocus = document.activeElement;
            activeStack.push(modal);
            modal.classList.add('is-active');
            modal.setAttribute('aria-hidden', 'false');
        }

        syncBodyState();
        if (options.updateHash !== false) setHash(name);

        const focusable = getFocusable(modal);
        if (focusable) {
            window.setTimeout(() => focusable.focus({ preventScroll: true }), 0);
        }
    }

    function close(name, options = {}) {
        const modal = name ? getModal(name) : getTopModal();
        if (!modal) return;

        const index = activeStack.lastIndexOf(modal);
        if (index === -1) return;

        activeStack.splice(index, 1);
        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');

        if (options.updateHash !== false) clearHash(modal.dataset.modal);
        syncBodyState();

        const topModal = getTopModal();
        if (topModal) {
            const focusable = getFocusable(topModal);
            if (focusable) focusable.focus({ preventScroll: true });
            return;
        }

        if (options.restoreFocus !== false && previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus({ preventScroll: true });
        }
        previousFocus = null;
    }

    function closeAll(options = {}) {
        while (activeStack.length > 0) {
            close(undefined, { updateHash: false, restoreFocus: false });
        }
        if (options.updateHash !== false && window.location.hash) {
            history.pushState(null, '', window.location.pathname + window.location.search);
        }
        if (options.restoreFocus !== false && previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus({ preventScroll: true });
        }
        previousFocus = null;
    }

    function handleHash() {
        const name = window.location.hash.replace('#', '');
        if (HASHED_MODALS.has(name)) {
            open(name, { updateHash: false, stack: false });
        } else {
            closeAll({ updateHash: false });
        }
    }

    document.addEventListener('click', (event) => {
        const opener = event.target.closest('[data-open-modal]');
        if (opener) {
            event.preventDefault();
            open(opener.dataset.openModal);
            return;
        }

        const closer = event.target.closest('[data-close-modal]');
        if (closer) {
            event.preventDefault();
            close();
            return;
        }

        const backdrop = event.target.classList && event.target.classList.contains('modal') ? event.target : null;
        if (backdrop && backdrop.classList.contains('is-active') && !backdrop.dataset.static) {
            close(backdrop.dataset.modal);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const topModal = getTopModal();
        if (!topModal || topModal.dataset.static) return;
        close();
    });

    window.addEventListener('hashchange', handleHash);
    document.addEventListener('DOMContentLoaded', handleHash);

    window.ModalManager = {
        open,
        close,
        closeAll
    };
}());
