"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ตั้งค่า Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ตั้งค่า Telegram Config จาก Environment Variables
const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  // ดึงข้อมูลสินค้าจาก Supabase
  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*");
    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data || []);
      if (data && data.length > 0 && !selectedProductId) {
        setSelectedProductId(data[0].id);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const selectedProduct = products.find(
    (p) => String(p.id) === String(selectedProductId)
  );

  // ฟังก์ชันยิงแจ้งเตือนไปยัง Telegram API
  const sendTelegramNotification = async (messageText) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn("Telegram Token หรือ Chat ID ยังไม่ได้ตั้งค่าใน .env");
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: messageText,
          parse_mode: "HTML",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Telegram API Error:", errorData);
      }
    } catch (err) {
      // ครอบ try-catch เพื่อป้องกันไม่ให้กระทบกระบวนการขายบนหน้าเว็บ
      console.error("Failed to send Telegram notification:", err);
    }
  };

  // ฟังก์ชันบันทึกการขายและตัดสต๊อก
  const handleSell = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return alert("กรุณาเลือกสินค้า");

    const sellQty = parseInt(quantity);
    if (isNaN(sellQty) || sellQty <= 0) return alert("กรุณาระบุจำนวนที่ถูกต้อง");
    if (sellQty > selectedProduct.stock) return alert("สินค้าในสต๊อกมีไม่พอ");

    setLoading(true);

    try {
      const newStock = selectedProduct.stock - sellQty;
      const totalPrice = selectedProduct.price * sellQty;

      // 1. อัปเดตสต๊อกสินค้าในตาราง products
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", selectedProduct.id);

      if (updateError) throw updateError;

      // 2. บันทึกประวัติลงตาราง sales
      const { error: salesError } = await supabase.from("sales").insert([
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity: sellQty,
          total_price: totalPrice,
          sold_at: new Date().toISOString(),
        },
      ]);

      if (salesError) throw salesError;

      // --- ระบบส่งแจ้งเตือน Telegram ---
      const nowFormatted = new Date().toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
      });

      // งานที่ 1: แจ้งเตือน Order เข้า (New Order Alert)
      const orderMessage = `🛍️ <b>มีรายการขายใหม่!</b>
- สินค้า: ${selectedProduct.name}
- จำนวน: ${sellQty} ชิ้น
- ราคารวม: ${totalPrice.toLocaleString()} บาท
- สต๊อกคงเหลือปัจจุบัน: ${newStock} ชิ้น
- เวลา: ${nowFormatted}`;

      await sendTelegramNotification(orderMessage);

      // งานที่ 2: แจ้งเตือน Stock เหลือน้อย (Low Stock Alert <= 5)
      if (newStock <= 5) {
        const lowStockMessage = `🚨 <b>[เตือนภัย] สต๊อกสินค้าใกล้หมด!</b>
- สินค้า: ${selectedProduct.name}
- คงเหลือเพียง: ${newStock} ชิ้น
⚠️ กรุณาเติมสต๊อกสินค้าด่วน!`;

        await sendTelegramNotification(lowStockMessage);
      }

      alert("บันทึกการขายเรียบร้อยแล้ว!");
      setQuantity(1);
      fetchProducts(); // โหลดสต๊อกล่าสุดใหม่
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการขาย: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">🛒 หน้าร้านขายสินค้า</h1>

      <form onSubmit={handleSell} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เลือกสินค้า:
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {item.price} บาท (คงเหลือ: {item.stock} ชิ้น)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            จำนวนที่ขาย:
          </label>
          <input
            type="number"
            min="1"
            max={selectedProduct ? selectedProduct.stock : 1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>

        {selectedProduct && (
          <div className="p-4 bg-gray-50 rounded-md space-y-1">
            <p className="text-sm text-gray-600">
              ราคาต่อหน่วย: <b>{selectedProduct.price}</b> บาท
            </p>
            <p className="text-sm text-gray-600">
              จำนวนคงเหลือ: <b>{selectedProduct.stock}</b> ชิ้น
            </p>
            <p className="text-lg font-bold text-green-700 mt-2">
              ราคารวมทั้งหมด: {(selectedProduct.price * (parseInt(quantity) || 0)).toLocaleString()} บาท
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedProduct || selectedProduct.stock <= 0}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-400"
        >
          {loading ? "กำลังบันทึก..." : "ยืนยันการขาย"}
        </button>
      </form>
    </div>
  );
}
