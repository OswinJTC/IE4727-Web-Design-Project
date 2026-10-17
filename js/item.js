(function () {
    var MIN = 1;
    var MAX = 20;                                // same per-dish limit as the cart
    var qty = 1;

    window.addEventListener('load', init);

    function init() {
        var link = document.getElementById('add-to-cart');
        if (!link) return;                       // dish not found: nothing to set up

        document.getElementById('qty-dec').addEventListener('click', function () { setQty(qty - 1); });
        document.getElementById('qty-inc').addEventListener('click', function () { setQty(qty + 1); });
        link.addEventListener('click', addToCart);
        setQty(1);
    }

    // Send the add request in the background so the page stays as it is, then confirm it here
    function addToCart(e) {
        var link = document.getElementById('add-to-cart');
        var added = qty;
        e.preventDefault();

        fetch(link.href)
            .then(function (response) {
                if (!response.ok) throw new Error('Request failed');
                showNote('Added ' + added + ' to your cart. ', true);
            })
            .catch(function () {
                showNote('Could not add to your cart. Please try again.', false);
            });
    }

    function showNote(text, withCartLink) {
        var note = document.getElementById('added-note');
        note.textContent = text;
        if (withCartLink) {
            var cartLink = document.createElement('a');
            cartLink.href = 'cart.php';
            cartLink.textContent = 'View cart';
            note.appendChild(cartLink);
        }
    }

    // The quantity only lives here until "Add to cart" is clicked: the link carries it to the server
    function setQty(n) {
        var link = document.getElementById('add-to-cart');
        qty = Math.min(MAX, Math.max(MIN, n));

        document.getElementById('qty-value').textContent = qty;
        document.getElementById('qty-dec').disabled = qty === MIN;
        document.getElementById('qty-inc').disabled = qty === MAX;

        link.href = link.dataset.baseHref + '&qty=' + qty;
        document.getElementById('add-total').textContent = '$' + (qty * parseFloat(link.dataset.price)).toFixed(2);
    }
})();
