(function () {
    window.addEventListener('load', init);

    function init() {
        var rows = document.querySelectorAll('.orders-table tbody tr[data-href]');
        for (var i = 0; i < rows.length; i++) {
            rows[i].addEventListener('click', openOrder);
        }

        var cancelForm = document.getElementById('cancel-form');
        if (cancelForm) cancelForm.addEventListener('submit', confirmCancel);
    }

    // Cancelling cannot be undone, so ask first
    function confirmCancel(e) {
        if (!window.confirm('Cancel this order? This cannot be undone.')) {
            e.preventDefault();
        }
    }

    // Clicking anywhere on a row opens that order in the detail panel
    function openOrder(e) {
        window.location.href = e.currentTarget.dataset.href;
    }
})();
