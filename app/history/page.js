"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function HistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงรายการประวัติการขายทั้งหมดจาก Supabase เรียงจากล่าสุดไปเก่าสุด
  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("sold_at", { ascending: false });

    if (error) {
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการขาย: " + error.message);
    } else {
      setSales(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // คำนวณยอดขายรวมทั้งหมด (Sum ของ total_price ทุกรายการ)
  const grandTotal = sales.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);

  // ฟังก์ชันแปลงรูปแบบวันเวลาให้อ่านง่าย
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem" }}>🧾 ประวัติการขาย</h2>

      {/* การ์ดสรุปยอดขายรวมทั้งหมด */}
      <div
        style={{
          background: "#ffffff",
          padding: "1.25rem 1.5rem",
          borderRadius: "8px",
          border: "1px solid #e4ded0",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        }}
      >
        <span style={{ fontSize: "1.05rem", fontWeight: "600", color: "#7a7a72" }}>
          ยอดขายรวมทั้งหมด ({sales.length} รายการ)
        </span>
        <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "#c96a4e" }}>
          ฿{grandTotal.toLocaleString()}
        </span>
      </div>

      {/* ตารางแสดงรายการประวัติการขาย */}
      <div style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e4ded0", overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: "1.5rem", textAlign: "center", color: "#7a7a72" }}>กำลังโหลดข้อมูลประวัติการขาย...</p>
        ) : sales.length === 0 ? (
          <p style={{ padding: "1.5rem", textAlign: "center", color: "#7a7a72" }}>ยังไม่มีประวัติการขาย</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#2f5233", color: "#ffffff" }}>
                <th style={thStyle}>วันเวลาที่ขาย</th>
                <th style={thStyle}>ชื่อสินค้า</th>
                <th style={{ ...thStyle, textAlign: "right" }}>จำนวน</th>
                <th style={{ ...thStyle, textAlign: "right" }}>ยอดรวม (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #e4ded0" }}>
                  <td style={tdStyle}>{formatDate(item.sold_at)}</td>
                  <td style={{ ...tdStyle, fontWeight: "500" }}>{item.product_name}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: "600", color: "#c96a4e" }}>
                    ฿{Number(item.total_price).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Inline Styles
const thStyle = {
  padding: "0.75rem 1rem",
  fontSize: "0.9rem",
  fontWeight: "600",
};

const tdStyle = {
  padding: "0.75rem 1rem",
  fontSize: "0.9rem",

};
