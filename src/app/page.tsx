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
    } } catch (e) {
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
          items: items.map((item) => ({ prd_id: item.id })),
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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-md bg-gray-50 rounded-xl shadow-lg p-6 sm:p-8 flex flex-col gap-4">
        <h1 className="text-xl font-bold text-center mb-2">POSレジ</h1>
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
          </div>/Users/shouya/Documents/仕事/tech0/step4/2
        </div>
        {/* コード入力エリア */}
        <div className="flex flex-col gap-1 mb-1">
          <label className="text-xs text-gray-500">商品コード</label>
          <input
            type="text"
            className="w-full p-2 border rounded text-center"
            placeholder="商品コードを入力"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReadProduct()}
            disabled={loading}
          />
        </div>
        {/* 読み込みボタン */}
        <button
          className="w-full p-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold transition disabled:opacity-50"
          onClick={handleReadProduct}
          disabled={loading || !code}
        >
          商品コード読み込み
        </button>
        {/* 名称・単価表示 */}
        <div className="flex gap-2 mb-1">
          <div className="flex-1 p-2 bg-white rounded border text-center min-h-[2.5rem]">
            {product ? product.name : productError || ""}
          </div>
          <div className="w-24 p-2 bg-white rounded border text-center min-h-[2.5rem]">
            {product ? `${product.price}円` : ""}
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
        {/* 購入リスト */}
        <div className="bg-white p-2 rounded border w-full">
          <div className="font-bold mb-1 text-sm">購入リスト</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="text-left font-normal">商品名</th>
                <th className="text-center font-normal">数量</th>
                <th className="text-right font-normal">単価</th>
                <th className="text-right font-normal">小計</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-2">リストに商品がありません</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.code} className="border-b last:border-b-0">
                    <td>{item.name}</td>
                    <td className="text-center">{item.qty}</td>
                    <td className="text-right">{item.price}円</td>
                    <td className="text-right">{item.price * item.qty}円</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* 購入ボタン */}
        <button
          className="w-full p-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold transition disabled:opacity-50"
          onClick={handlePurchase}
          disabled={items.length === 0 || loading}
        >
          購入
        </button>
        {/* 合計金額ポップアップ */}
        {showTotal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded shadow text-center">
              <div className="mb-4 text-lg font-bold">合計金額（税込）</div>
              <div className="mb-4 text-2xl">{total}円</div>
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
    </div>
  );
}
