"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*").order("id", { ascending: true });
    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data || []);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const sendTelegramNotification = async (messageText) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: messageText,
          parse_mode: "HTML",
        }),
      });
    } catch (err) {
      console.error("Telegram notification failed:", err);
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) return alert("สินค้าหมด!");

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`สินค้าในสต๊อกมีเพียง ${product.stock} ชิ้น`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock) {
              alert(`สินค้าในสต๊อกมีเพียง ${item.stock} ชิ้น`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("กรุณาเลือกสินค้าลงตะกร้าก่อนทำรายการ");

    setLoading(true);
    try {
      for (const item of cart) {
        const newStock = item.stock - item.quantity;
        const itemTotalPrice = item.price * item.quantity;

        // 1. ตัดสต๊อก
        const { error: updateError } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.id);

        if (updateError) throw updateError;

        // 2. บันทึกประวัติการขาย
        const { error: salesError } = await supabase.from("sales").insert([
          {
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            total_price: itemTotalPrice,
            sold_at: new Date().toISOString(),
          },
        ]);

        if (salesError) throw salesError;

        // 3. ยิง Telegram Notification
        const nowFormatted = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
        const orderMessage = `🛍️ <b>มีรายการขายใหม่!</b>
- สินค้า: ${item.name}
- จำนวน: ${item.quantity} ชิ้น
- ราคารวม: ${itemTotalPrice.toLocaleString()} บาท
- สต๊อกคงเหลือปัจจุบัน: ${newStock} ชิ้น
- เวลา: ${nowFormatted}`;

        await sendTelegramNotification(orderMessage);

        if (newStock <= 5) {
          const lowStockMessage = `🚨 <b>[เตือนภัย] สต๊อกสินค้าใกล้หมด!</b>
- สินค้า: ${item.name}
- คงเหลือเพียง: ${newStock} ชิ้น
⚠️ กรุณาเติมสต๊อกสินค้าด่วน!`;
          await sendTelegramNotification(lowStockMessage);
        }
      }

      alert("ชำระเงินและตัดสต๊อกสำเร็จ!");
      setCart([]);
      fetchProducts();
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการชำระเงิน: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-stone-100 p-4 md:p-8 text-stone-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ฝั่งซ้าย: แสดงการ์ดรายการสินค้า */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
            <h1 className="text-2xl font-bold text-emerald-900 flex items-center gap-2">
              🌿 รายการสินค้า (Fern & Jar)
            </h1>
            <input
              type="text"
              placeholder="🔍 ค้นหาสินค้า หรือ SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`bg-white p-4 rounded-xl border border-stone-200 shadow-sm transition-all flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-emerald-500 ${
                    isOutOfStock ? "opacity-50 cursor-not-allowed bg-stone-50" : ""
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded mb-2">
                      {product.sku || `ID: ${product.id}`}
                    </div>
                    <h3 className="font-bold text-stone-900 text-sm md:text-base line-clamp-2">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-stone-500 block">คงเหลือ: {product.stock} {product.unit || 'ชิ้น'}</span>
                      <span className="text-base font-bold text-emerald-800">฿{product.price}</span>
                    </div>
                    <button
                      disabled={isOutOfStock}
                      className={`p-2 rounded-lg text-white font-bold text-sm ${
                        isOutOfStock ? "bg-stone-300" : "bg-emerald-700 hover:bg-emerald-800"
                      }`}
                    >
                      {isOutOfStock ? "หมด" : "+ เพิ่ม"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ฝั่งขวา: ตะกร้าสินค้าและการชำระเงิน */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col h-fit sticky top-6">
          <h2 className="text-xl font-bold text-stone-900 pb-4 border-b border-stone-100 flex items-center justify-between">
            <span>🛒 ตะกร้าสินค้า</span>
            <span className="text-xs font-normal text-stone-500">({cart.length} รายการ)</span>
          </h2>

          <div className="divide-y divide-stone-100 my-4 max-h-[50vh] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <p className="text-3xl mb-2">🍃</p>
                <p className="text-sm">ยังไม่มีสินค้าในตะกร้า</p>
                <p className="text-xs text-stone-300 mt-1">กดเลือกสินค้าจากการ์ดซ้ายมือได้เลย</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-stone-800">{item.name}</h4>
                    <span className="text-xs text-stone-500">฿{item.price} / ชิ้น</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded bg-stone-100 text-stone-700 hover:bg-stone-200 font-bold flex items-center justify-center text-xs"
                    >
                      -
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded bg-stone-100 text-stone-700 hover:bg-stone-200 font-bold flex items-center justify-center text-xs"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-600 text-xs ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-stone-100 space-y-3">
            <div className="flex justify-between text-stone-600 text-sm">
              <span>ยอดรวมทั้งหมด</span>
              <span className="font-semibold">฿{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-900 text-xl font-bold pt-2 border-t border-stone-100">
              <span>ราคาสุทธิ</span>
              <span>฿{totalAmount.toLocaleString()}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full mt-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 px-4 rounded-xl shadow-md disabled:bg-stone-300 disabled:shadow-none transition-all text-center"
            >
              {loading ? "กำลังบันทึก..." : "ยืนยันการชำระเงิน"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
