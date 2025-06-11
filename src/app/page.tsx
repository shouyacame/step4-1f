"use client";
import { useState } from "react";

// 商品型
interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
}

// 購入リストアイテム型
interface PurchaseItem extends Product {
  qty: number;
}

export default function Home() {
  const [code, setCode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [productError, setProductError] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [showTotal, setShowTotal] = useState(false);
  const [total, setTotal] = useState(0);
  const [empCd, setEmpCd] = useState("EMP001");
  const [storeCd, setStoreCd] = useState("30");
  const [posNo, setPosNo] = useState("90");
  const [loading, setLoading] = useState(false);

  // 小計計算
  const subTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  // 消費税計算 (10%)
  const tax = Math.floor(subTotal * 0.10);
  // 合計金額
  const grandTotal = subTotal + tax;

  // 商品コード読み込み
  const handleReadProduct = async () => {
    setProduct(null);
    setProductError("");
    if (!code) return;
    setLoading(true);
    try {
      // 修正後
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product/${code}`);
      const data = await res.json();
      if (!data) throw new Error("商品がマスタ未登録です");
      setProduct(data);
    } catch (e) {
      const err = e as Error;
      setProductError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // リストに追加
  const handleAddToList = () => {
    if (!product) return;
    setItems((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        return [...prev, { ...product, qty: 1 }];
      }
    });
    setCode("");
    setProduct(null);
    setProductError("");
  };

  // 数量変更
  const handleQtyChange = (id: number, delta: number) => {
    setItems((prev) => {
      const updatedItems = prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + delta } : item
      ).filter(item => item.qty > 0); // 数量が0以下になったら削除
      return updatedItems;
    });
  };

  // 商品削除
  const handleRemoveItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // 購入処理
  const handlePurchase = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
     // 修正後
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emp_cd: empCd,
          store_cd: storeCd,
          pos_no: posNo,
          items: items.map((item) => ({ prd_id: item.id, qty: item.qty })), // 数量も送る
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTotal(Number(data.total));
        setShowTotal(true);
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // 合計金額ポップアップ閉じる
  const handleCloseTotal = () => {
    setShowTotal(false);
    setCode("");
    setProduct(null);
    setProductError("");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-4">
        {/* 商品入力部分 */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-6 sm:p-8 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center">商品入力</h2>
          {/* 店舗コード・POS機ID・担当者コード入力 */}
          <div className="flex gap-2 mb-2">
            <div className="flex flex-col w-1/3">
              <label className="text-xs text-gray-500 mb-1">店舗コード</label>
              <input
                type="text"
                className="p-2 border rounded text-center"
                placeholder="店舗コード"
                value={storeCd}
                onChange={e => setStoreCd(e.target.value)}
              />
            </div>
            <div className="flex flex-col w-1/3">
              <label className="text-xs text-gray-500 mb-1">POS機ID</label>
              <input
                type="text"
                className="p-2 border rounded text-center"
                placeholder="POS機ID"
                value={posNo}
                onChange={e => setPosNo(e.target.value)}
              />
            </div>
            <div className="flex flex-col w-1/3">
              <label className="text-xs text-gray-500 mb-1">担当者コード</label>
              <input
                type="text"
                className="p-2 border rounded text-center"
                placeholder="担当者コード"
                value={empCd}
                onChange={e => setEmpCd(e.target.value)}
              />
            </div>
          </div>
          {/* コード入力エリア */}
          <div className="flex flex-col gap-1 mb-1">
            <label className="text-xs text-gray-500">商品コード</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2 border rounded text-center"
                placeholder="商品コードを入力"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReadProduct()}
                disabled={loading}
              />
              <button
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold transition disabled:opacity-50"
                onClick={handleReadProduct}
                disabled={loading || !code}
              >
                読み込み
              </button>
            </div>
          </div>
          {/* 名称・単価表示 */}
          <div className="flex gap-2 mb-1">
            <div className="flex-1 p-2 bg-gray-100 rounded border text-center min-h-[2.5rem] flex items-center justify-center">
              {product ? product.name : productError || "商品名称"}
            </div>
            <div className="w-24 p-2 bg-gray-100 rounded border text-center min-h-[2.5rem] flex items-center justify-center">
              {product ? `¥${product.price}` : "単価"}
            </div>
          </div>
          {/* 追加ボタン */}
          <button
            className="w-full p-2 bg-green-500 hover:bg-green-600 text-white rounded font-bold transition disabled:opacity-50"
            onClick={handleAddToList}
            disabled={!product}
          >
            追加
          </button>
        </div>

        {/* 購入品目リスト部分 */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-6 sm:p-8 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-center">購入品目リスト</h2>
            <span className="text-sm text-gray-500">{items.length}品目</span>
          </div>
          <div className="bg-white p-2 rounded border w-full">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="text-left font-normal">商品名</th>
                  <th className="text-center font-normal">数量</th>
                  <th className="text-right font-normal">単価</th>
                  <th className="text-right font-normal">小計</th>
                  <th className="text-right font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-2">リストに商品がありません</td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td>{item.name}</td>
                      <td className="text-center flex items-center justify-center">
                        <button onClick={() => handleQtyChange(item.id, -1)} className="px-2 py-1 border rounded bg-gray-200 hover:bg-gray-300 transition text-sm">-</button>
                        <span className="mx-2">{item.qty}</span>
                        <button onClick={() => handleQtyChange(item.id, 1)} className="px-2 py-1 border rounded bg-gray-200 hover:bg-gray-300 transition text-sm">+</button>
                      </td>
                      <td className="text-right">¥{item.price}</td>
                      <td className="text-right">¥{item.price * item.qty}</td>
                      <td className="text-right">
                        <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* 合計金額表示 */}
          <div className="mt-2 text-right">
            <div className="flex justify-between text-sm">
              <span>小計:</span>
              <span>¥{subTotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>消費税 (10%):</span>
              <span>¥{tax}</span>
            </div>
            <div className="flex justify-between text-lg font-bold mt-2">
              <span>合計:</span>
              <span>¥{grandTotal}</span>
            </div>
          </div>
          {/* 購入ボタン */}
          <button
            className="w-full p-3 mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold transition disabled:opacity-50 text-lg"
            onClick={handlePurchase}
            disabled={grandTotal === 0 || loading}
          >
            購入
          </button>
        </div>
      </div>
      {/* 合計金額ポップアップ */}
      {showTotal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="text-2xl font-bold mt-2">購入完了</div>
            </div>
            <div className="mb-4 text-lg">合計金額（税込）</div>
            <div className="mb-4 text-3xl font-bold text-green-600">¥{total}</div>
            <button
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold"
              onClick={handleCloseTotal}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
