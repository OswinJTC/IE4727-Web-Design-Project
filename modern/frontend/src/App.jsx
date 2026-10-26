import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Item from "./pages/Item";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import LoginRegister from "./pages/LoginRegister";
import RegisterSuccess from "./pages/RegisterSuccess";
import Shell from "./components/Shell";
import { Link } from "react-router-dom";
import { useShop } from "./context/ShopContext";
import { backLink, container, loading } from "./lib/ui";

function NotFound() {
    return (
        <Shell title="Page not found">
            <main className={container}>
                <h1 className="mb-[22px] text-5xl leading-[1.05] font-black max-mobile:text-[34px]">
                    Page not found
                </h1>
                <p className="mb-[22px] text-[17px] leading-[1.45] text-[#3c3733]">
                    That page does not exist.{" "}
                    <Link className={backLink} to="/">
                        Back to home
                    </Link>
                </p>
            </main>
        </Shell>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/item/:id" element={<Item />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/login" element={<LoginRegister />} />
            <Route path="/register-success" element={<RegisterSuccess />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
