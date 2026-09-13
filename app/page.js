"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State สำหรับเพิ่มสินค้า
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    price: "",
    stock: "",
    unit: "",
  });

  // State สำหรับแก้ไขสินค้า (เก็บ id สินค้าที่กำลังแก้ไข)
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    sku: "",
    name: "",
    price: "",
    stock: "",
    unit: "",
  });

  // ดึงข้อมูลสินค้าทั้งหมดจาก Supabase
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล: " + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // เพิ่มสินค้าใหม่
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!formData.sku || !formData.name || !formData.price) {
      alert("กรุณากรอกข้อมูลสำคัญ (SKU, ชื่อ, ราคา) ให้ครบถ้วน");
      return;
    }

    const newProduct = {
      sku: formData.sku,
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0,
      unit: formData.unit,
    };

    const { error } = await supabase.from("products").insert([newProduct]);

    if (error) {
      alert("เพิ่มสินค้าไม่สำเร็จ: " + error.message);
    } else {
      setFormData({ sku: "", name: "", price: "", stock: "", unit: "" });
      fetchProducts();
    }
  };

  // เริ่มแก้ไขสินค้า (คัดลอกข้อมูลสินค้าแถวนั้นเข้า editFormData)
  const handleStartEdit = (product) => {
    setEditingId(product.id);
    setEditFormData({
      sku: product.sku || "",
      name: product.name || "",
      price: product.price || 0,
      stock: product.stock || 0,
      unit: product.unit || "",
    });
  };

  // บันทึกการแก้ไขสินค้าแบบ Inline
  const handleSaveEdit = async (id) => {
    const updatedProduct = {
      sku: editFormData.sku,
      name: editFormData.name,
      price: parseFloat(editFormData.price),
      stock: parseInt(editFormData.stock) || 0,
      unit: editFormData.unit,
    };

    const { error } = await supabase
      .from("products")
      .update(updatedProduct)
      .eq("id", id);

    if (error) {
      alert("อัปเดตไม่สำเร็จ: " + error.message);
    } else {
      setEditingId(null);
      fetchProducts();
    }
  };

  // ลบสินค้า
  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`คุณต้องการลบสินค้า "${name}" ใช่หรือไม่?`)) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert("ลบสินค้าไม่สำเร็จ: " + error.message);
    } else {
      fetchProducts();
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem" }}>📦 จัดการรายการสินค้า</h2>

      {/* ฟอร์มเพิ่มสินค้าใหม่ */}
      <form
        onSubmit={handleAddProduct}
        style={{
          background: "#ffffff",
          padding: "1.25rem",
          borderRadius: "8px",
          border: "1px solid #e4ded0",
          marginBottom: "2rem",
        }}
      >
        <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>➕ เพิ่มสินค้าใหม่</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <input
            type="text"
            placeholder="SKU"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            style={inputStyle}
            required
          />
          <input
            type="text"
            placeholder="ชื่อสินค้า"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={inputStyle}
            required
          />
          <input
            type="number"
            placeholder="ราคา"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            style={inputStyle}
            required
          />
          <input
            type="number"
            placeholder="จำนวนสต็อก"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="หน่วย (เช่น ชิ้น, ถุง)"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            style={inputStyle}
          />
        </div>
        <button type="submit" style={btnPrimaryStyle}>
          บันทึกสินค้า
        </button>
      </form>

      {/* ตารางแสดงรายการสินค้า */}
      <div style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e4ded0", overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: "1.5rem", textAlign: "center", color: "#7a7a72" }}>กำลังโหลดข้อมูล...</p>
        ) : products.length === 0 ? (
          <p style={{ padding: "1.5rem", textAlign: "center", color: "#7a7a72" }}>ยังไม่มีสินค้าในระบบ</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#2f5233", color: "#ffffff" }}>
                <th style={thStyle}>SKU</th>
                <th style={thStyle}>ชื่อสินค้า</th>
                <th style={thStyle}>ราคา (บาท)</th>
                <th style={thStyle}>คงเหลือ</th>
                <th style={thStyle}>หน่วย</th>
                <th style={{ ...thStyle, textAlign: "center" }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #e4ded0" }}>
                    <td style={tdStyle}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.sku}
                          onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                          style={inputInlineStyle}
                        />
                      ) : (
                        p.sku
                      )}
                    </td>
                    <td style={tdStyle}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          style={inputInlineStyle}
                        />
                      ) : (
                        p.name
                      )}
                    </td>
                    <td style={tdStyle}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editFormData.price}
                          onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                          style={inputInlineStyle}
                        />
                      ) : (
                        p.price
                      )}
                    </td>
                    <td style={tdStyle}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editFormData.stock}
                          onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })}
                          style={inputInlineStyle}
                        />
                      ) : (
                        p.stock
                      )}
                    </td>
                    <td style={tdStyle}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.unit}
                          onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                          style={inputInlineStyle}
                        />
                      ) : (
                        p.unit
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center", whiteSpace: "nowrap" }}>
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEdit(p.id)} style={btnSaveStyle}>
                            บันทึก
                          </button>
                          <button onClick={() => setEditingId(null)} style={btnCancelStyle}>
                            ยกเลิก
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleStartEdit(p)} style={btnEditStyle}>
                            แก้ไข
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id, p.name)} style={btnDeleteStyle}>
                            ลบ
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Inline Styles
const inputStyle = {
  padding: "0.5rem",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "0.9rem",
  width: "100%",
};

const inputInlineStyle = {
  ...inputStyle,
  padding: "0.25rem 0.4rem",
};

const thStyle = {
  padding: "0.75rem 1rem",
  fontSize: "0.9rem",
  fontWeight: "600",
};

const tdStyle = {
  padding: "0.75rem 1rem",
  fontSize: "0.9rem",
};

const btnPrimaryStyle = {
  background: "#2f5233",
  color: "white",
  border: "none",
  padding: "0.5rem 1.25rem",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "500",
};

const btnEditStyle = {
  background: "#4a7c59",
  color: "white",
  border: "none",
  padding: "0.3rem 0.6rem",
  borderRadius: "4px",
  cursor: "pointer",
  marginRight: "0.4rem",
  fontSize: "0.8rem",
};

const btnDeleteStyle = {
  background: "#c96a4e",
  color: "white",
  border: "none",
  padding: "0.3rem 0.6rem",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.8rem",
};

const btnSaveStyle = {
  ...btnEditStyle,
  background: "#2f5233",
};

const btnCancelStyle = {
  ...btnDeleteStyle,
  background: "#7a7a72",
};
