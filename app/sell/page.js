"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ดึงรายการสินค้าทั้งหมดเพื่อนำมาแสดงใน Dropdown
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า: " + error.message);
    } else {
      setProducts(data || []);
      if (data && data.length > 0) {
        setSelectedProductId(data[0].id); // เลือกสินค้าตัวแรกเป็นค่าเริ่มต้น
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ค้นหาสินค้าที่ถูกเลือกในปัจจุบัน
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // คำนวณราคารวมอัตโนมัติ (ราคา x จำนวน)
  const totalPrice = selectedProduct ? selectedProduct.price * quantity : 0;

  // จัดการการบันทึกการขาย
  const handleSell = async (e) => {
    e.preventDefault();

    if (!selectedProduct) {
      alert("กรุณาเลือกสินค้า");
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert("กรุณากรอกจำนวนที่ถูกต้อง (มากกว่า 0)");
      return;
    }

    // 1. ตรวจสอบว่าสินค้ามีสต็อกเพียงพอหรือไม่
    if (selectedProduct.stock < qty) {
      alert(
        `สินค้าในสต็อกไม่พอ! (คงเหลือ: ${selectedProduct.stock} ${selectedProduct.unit || "ชิ้น"})`
      );
      return;
    }

    setSubmitting(true);

    try {
      // 2. บันทึกรายการลงตาราง sales
      const saleData = {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: qty,
        total_price: totalPrice,
        sold_at: new Date().toISOString(),
      };

      const { error: saleError } = await supabase
        .from("sales")
        .insert([saleData]);

      if (saleError) throw saleError;

      // 3. อัปเดต stock ในตาราง products ให้ลดลงตามจำนวนที่ขาย
      const updatedStock = selectedProduct.stock - qty;
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: updatedStock })
        .eq("id", selectedProduct.id);

      if (updateError) throw updateError;

      // 4. แสดงข้อความสำเร็จและรีเซ็ตฟอร์ม
      alert(`บันทึกการขายสำเร็จ! (รวมเป็นเงิน ${totalPrice.toLocaleString()} บาท)`);
      setQuantity(1);
      
      // ดึงข้อมูลสินค้าใหม่เพื่ออัปเดตสต็อกล่าสุดในหน้าเว็บ
      await fetchProducts();
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการขาย: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "1.5rem" }}>🛒 หน้าขายสินค้า</h2>

      <form
        onSubmit={handleSell}
        style={{
          background: "#ffffff",
          padding: "1.5rem",
          borderRadius: "8px",
          border: "1px solid #e4ded0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        {loading ? (
          <p style={{ textAlign: "center", color: "#7a7a72" }}>กำลังโหลดรายการสินค้า...</p>
        ) : products.length === 0 ? (
          <p style={{ textAlign: "center", color: "#7a7a72" }}>
            ไม่พบรายการสินค้า กรุณาเพิ่มสินค้าที่หน้าแรกก่อน
          </p>
        ) : (
          <>
            {/* เลือกสินค้า */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={labelStyle}>เลือกสินค้า:</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                style={inputStyle}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.price} บาท (คงเหลือ: {p.stock} {p.unit || "ชิ้น"})
                  </option>
                ))}
              </select>
            </div>

            {/* จำนวนที่ต้องการขาย */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={labelStyle}>จำนวนที่ขาย:</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            {/* รายละเอียดสรุปราคารวม */}
            {selectedProduct && (
              <div
                style={{
                  background: "#f7f3ea",
                  padding: "1rem",
                  borderRadius: "6px",
                  marginBottom: "1.5rem",
                  border: "1px solid #e4ded0",
                }}
              >
                <div style={{ display: "flex", justifyBetween: "space-between", marginBottom: "0.5rem" }}>
                  <span>ราคาต่อหน่วย:</span>
                  <strong>{selectedProduct.price.toLocaleString()} บาท</strong>
                </div>
                <div style={{ display: "flex", justifyBetween: "space-between", marginBottom: "0.5rem" }}>
                  <span>จำนวนคงเหลือ:</span>
                  <span style={{ color: selectedProduct.stock < 5 ? "#c96a4e" : "#2b2b28" }}>
                    {selectedProduct.stock} {selectedProduct.unit || "ชิ้น"}
                  </span>
                </div>
                <hr style={{ border: "none", borderTop: "1px solid #e4ded0", margin: "0.5rem 0" }} />
                <div style={{ display: "flex", justifyBetween: "space-between", fontSize: "1.2rem", color: "#c96a4e" }}>
                  <strong>ราคารวมทั้งหมด:</strong>
                  <strong>{totalPrice.toLocaleString()} บาท</strong>
                </div>
              </div>
            )}

            {/* ปุ่มกดยืนยันการขาย */}
            <button
              type="submit"
              disabled={submitting || !selectedProduct || selectedProduct.stock <= 0}
              style={{
                ...btnPrimaryStyle,
                opacity: submitting || !selectedProduct || selectedProduct.stock <= 0 ? 0.6 : 1,
                cursor: submitting || !selectedProduct || selectedProduct.stock <= 0 ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "กำลังบันทึก..." : "ยืนยันการขาย"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

// Inline Styles
const labelStyle = {
  display: "block",
  marginBottom: "0.5rem",
  fontWeight: "600",
  fontSize: "0.95rem",
};

const inputStyle = {
  width: "100%",
  padding: "0.6rem 0.8rem",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const btnPrimaryStyle = {
  width: "100%",
  background: "#2f5233",
  color: "white",
  border: "none",
  padding: "0.75rem",
  borderRadius: "6px",
  fontSize: "1.05rem",
  fontWeight: "600",
};
