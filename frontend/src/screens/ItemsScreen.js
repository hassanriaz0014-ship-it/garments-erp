import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, TextInput, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import client from '../api/client';

const DEFAULT_COST_ITEMS = [
  { id: '1', label: 'Fabric', amount: '' },
  { id: '2', label: 'Thread & Accessories', amount: '' },
  { id: '3', label: 'Button/Zippers', amount: '' },
  { id: '4', label: 'Labour', amount: '' },
  { id: '5', label: 'Packaging', amount: '' },
  { id: '6', label: 'Carton', amount: '' },
  { id: '7', label: 'Sticker', amount: '' },
  { id: '8', label: 'Tag Card Patti', amount: '' },
  { id: '9', label: 'Woven Label', amount: '' },
  { id: '10', label: 'Polly Bag', amount: '' },
  { id: '11', label: 'Buttons', amount: '' },
  { id: '12', label: 'Button Labour', amount: '' },
  { id: '13', label: 'Cropping', amount: '' },
  { id: '14', label: 'Tape/Clip', amount: '' },
];

export default function ItemsScreen() {
  const [items, setItems] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [costingModalVisible, setCostingModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [costingItem, setCostingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [form, setForm] = useState({
    style_no: '', description: '', image_url: '', party_id: '', fabric: ''
  });
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');
  const [costingSheet, setCostingSheet] = useState(DEFAULT_COST_ITEMS);
  const [profitMargin, setProfitMargin] = useState('');
  const [newCostLabel, setNewCostLabel] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [itemsRes, partiesRes] = await Promise.all([
        client.get('/items'),
        client.get('/parties')
      ]);
      setItems(itemsRes.data);
      setParties(partiesRes.data.filter(p => p.type === 'Customer'));
    } catch (err) {
      console.log('Could not fetch items');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(i =>
    i.style_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (i.party_name && i.party_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openAddModal = () => {
    setEditingItem(null);
    setForm({ style_no: '', description: '', image_url: '', party_id: '', fabric: '' });
    setColors([]); setSizes([]);
    setNewColor(''); setNewSize('');
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      style_no: item.style_no || '',
      description: item.description || '',
      image_url: item.image_url || '',
      party_id: String(item.party_id || ''),
      fabric: item.fabric || ''
    });
    setColors(item.colors || []);
    setSizes(item.sizes || []);
    setNewColor(''); setNewSize('');
    setModalVisible(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await client.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(prev => ({ ...prev, image_url: res.data.url }));
    } catch (err) {
      alert('Image upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  const saveItem = async () => {
    if (!form.style_no) { alert('Style number is required'); return; }
    try {
      if (editingItem) {
        await client.put(`/items/${editingItem.id}`, {
          ...form, colors, sizes,
          fabric: form.fabric || '',
          costing_sheet: editingItem.costing_sheet || [],
          profit_margin: editingItem.profit_margin || 0,
          selling_price: editingItem.selling_price || 0,
          total_cost: editingItem.total_cost || 0,
          labour_price: editingItem.labour_price || 0
        });
      } else {
        await client.post('/items', { ...form, colors, sizes, fabric: form.fabric || '' });
      }
      setModalVisible(false);
      setEditingItem(null);
      fetchAll();
    } catch (err) { alert('Could not save item'); }
  };

  const deleteItem = async (id) => {
    if (window.confirm('Delete this item?')) {
      try { await client.delete(`/items/${id}`); fetchAll(); }
      catch (err) { alert('Could not delete'); }
    }
  };

  const openCostingSheet = (item) => {
    setCostingItem(item);
    const saved = item.costing_sheet;
    const parsed = typeof saved === 'string' ? JSON.parse(saved) : (saved || []);
    if (parsed.length > 0) setCostingSheet(parsed);
    else setCostingSheet(DEFAULT_COST_ITEMS.map(i => ({ ...i, amount: '' })));
    setProfitMargin(String(item.profit_margin || ''));
    setCostingModalVisible(true);
  };

  const updateCostItem = (id, field, value) => {
    setCostingSheet(costingSheet.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addCustomCostItem = () => {
    if (!newCostLabel.trim()) return;
    setCostingSheet([...costingSheet, {
      id: String(Date.now()), label: newCostLabel.trim(), amount: ''
    }]);
    setNewCostLabel('');
  };

  const removeCostItem = (id) => setCostingSheet(costingSheet.filter(c => c.id !== id));

  const totalCost = costingSheet.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  const sellingPrice = totalCost + parseFloat(profitMargin || 0);

  const saveCostingSheet = async () => {
    try {
      await client.put(`/items/${costingItem.id}`, {
        style_no: costingItem.style_no,
        description: costingItem.description,
        colors: costingItem.colors || [],
        sizes: costingItem.sizes || [],
        image_url: costingItem.image_url || '',
        fabric: costingItem.fabric || '',
        labour_price: costingItem.labour_price || 0,
        costing_sheet: costingSheet,
        profit_margin: parseFloat(profitMargin || 0),
        selling_price: sellingPrice,
        total_cost: totalCost
      });
      setCostingModalVisible(false);
      setCostingItem(null);
      fetchAll();
    } catch (err) { alert('Could not save costing sheet'); }
  };

  const printCostingSheet = () => {
    const rows = costingSheet.map(c =>
      `<tr><td>${c.label}</td><td style="text-align:right">PKR ${parseInt(c.amount || 0).toLocaleString()}</td></tr>`
    ).join('');
    const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
    win.document.write(`<!DOCTYPE html><html><head><title>Costing Sheet — ${costingItem.style_no}</title>
      <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;max-width:500px;margin:0 auto}.header{background:#1e1b4b;color:#fff;padding:20px;border-radius:8px;margin-bottom:20px;text-align:center}.header h2{font-size:20px;margin-bottom:4px}.header p{font-size:13px;color:#a5b4fc}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#f3f4f6;color:#374151;padding:10px 12px;text-align:left;font-size:13px;border-bottom:2px solid #e5e7eb}td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}tr:nth-child(even){background:#f9fafb}.summary-row{display:flex;justify-content:space-between;padding:10px 12px;border-radius:6px;margin-bottom:8px}.selling-row{display:flex;justify-content:space-between;padding:16px;background:#1e1b4b;border-radius:8px;color:#fff;margin-top:8px}</style></head>
      <body>
        <div class="header">
          <h2>${costingItem.style_no}</h2>
          <p>${costingItem.description || ''} · ${costingItem.party_name || ''}</p>
          ${costingItem.fabric ? `<p style="margin-top:4px">Fabric: ${costingItem.fabric}</p>` : ''}
        </div>
        <table><thead><tr><th>Cost Item</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="summary-row" style="background:#f3f4f6"><span style="font-size:14px;font-weight:500;color:#374151">Total Cost</span><span style="font-size:16px;font-weight:bold;color:#1e1b4b">PKR ${totalCost.toLocaleString()}</span></div>
        <div class="summary-row" style="background:#f0fdf4"><span style="font-size:14px;color:#374151">Profit Margin</span><span style="font-size:15px;font-weight:600;color:#16a34a">+ PKR ${parseInt(profitMargin || 0).toLocaleString()}</span></div>
        <div class="selling-row"><div><div style="color:#a5b4fc;font-size:12px;letter-spacing:1px;margin-bottom:4px">SELLING PRICE</div><div style="color:#e0e7ff;font-size:12px">Total Cost + Profit Margin</div></div><div style="font-size:24px;font-weight:bold">PKR ${sellingPrice.toLocaleString()}</div></div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 500);
          };
        </script>
      </body></html>`);
    win.document.close();
    window.focus();
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#4361ee" /></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.searchInput}
        placeholder="🔍 Search by style no, description or party..."
        value={searchQuery} onChangeText={setSearchQuery} />

      <ScrollView>
        {filteredItems.length === 0
          ? <Text style={styles.empty}>No items found.</Text>
          : filteredItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemCardTop}>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    onClick={() => setPreviewImage(item.image_url)}
                    style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, marginRight: 12, cursor: 'pointer' }}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>👔</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.itemCardHeader}>
                    <Text style={styles.styleNo}>{item.style_no}</Text>
                    {item.selling_price > 0
                      ? <View style={styles.priceBadge}><Text style={styles.priceBadgeText}>PKR {parseInt(item.selling_price).toLocaleString()}</Text></View>
                      : <View style={styles.noPriceBadge}><Text style={styles.noPriceBadgeText}>No costing yet</Text></View>
                    }
                  </View>
                  <Text style={styles.itemDesc}>{item.description || '-'}</Text>
                  <Text style={styles.itemParty}>🏪 {item.party_name || '-'}</Text>
                  {item.fabric ? <Text style={styles.itemFabric}>🧵 {item.fabric}</Text> : null}
                  {item.colors && item.colors.length > 0 && (
                    <View style={styles.tagsRow}>
                      {item.colors.map((c, i) => (
                        <View key={i} style={styles.colorTag}><Text style={styles.colorTagText}>{c}</Text></View>
                      ))}
                    </View>
                  )}
                  {item.sizes && item.sizes.length > 0 && (
                    <View style={styles.tagsRow}>
                      {item.sizes.map((s, i) => (
                        <View key={i} style={styles.sizeTag}><Text style={styles.sizeTagText}>{s}</Text></View>
                      ))}
                    </View>
                  )}
                </View>
                {item.total_cost > 0 && (
                  <View style={styles.costingInfo}>
                    <Text style={styles.costingLabel}>Cost</Text>
                    <Text style={styles.costingValue}>PKR {parseInt(item.total_cost).toLocaleString()}</Text>
                    <Text style={styles.costingLabel}>Margin</Text>
                    <Text style={[styles.costingValue, { color: '#16a34a' }]}>PKR {parseInt(item.profit_margin || 0).toLocaleString()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.itemCardActions}>
                <TouchableOpacity style={styles.costingBtn} onPress={() => openCostingSheet(item)}>
                  <Text style={styles.costingBtnText}>📊 Costing Sheet</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => deleteItem(item.id)}>
                  <Text style={styles.delBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        }
      </ScrollView>

      {/* ADD/EDIT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Item'}</Text>
            <ScrollView>
              <TextInput style={styles.input} placeholder="Style number * (e.g. ASM-265)"
                value={form.style_no} onChangeText={(v) => setForm({ ...form, style_no: v })} />
              <TextInput style={styles.input} placeholder="Description (e.g. Mens Band Neck Jubba)"
                value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />
              <TextInput style={styles.input} placeholder="Fabric (e.g. Wash N Wear, Khaddar)"
                value={form.fabric} onChangeText={(v) => setForm({ ...form, fabric: v })} />

              {/* IMAGE UPLOAD */}
              <Text style={styles.label}>Item Image</Text>
              {form.image_url ? (
                <View style={{ marginBottom: 10 }}>
                  <img src={form.image_url} style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, border: '1px solid #ddd' }} />
                  <TouchableOpacity style={styles.removeImgBtn} onPress={() => setForm({ ...form, image_url: '' })}>
                    <Text style={styles.removeImgText}>✕ Remove Image</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadBox}>
                  {imageUploading
                    ? <ActivityIndicator color="#4361ee" />
                    : <>
                        <Text style={styles.uploadIcon}>📷</Text>
                        <Text style={styles.uploadText}>Click to upload image</Text>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                      </>
                  }
                </View>
              )}

              <Text style={styles.label}>Party *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {parties.map(p => (
                  <TouchableOpacity key={p.id}
                    style={[styles.catBtn, String(form.party_id) === String(p.id) && styles.catBtnActive]}
                    onPress={() => setForm({ ...form, party_id: String(p.id) })}>
                    <Text style={[styles.catBtnText, String(form.party_id) === String(p.id) && styles.catBtnTextActive]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Colors</Text>
              <View style={styles.tagsRow}>
                {colors.map((c, i) => (
                  <TouchableOpacity key={i} style={styles.colorTag}
                    onPress={() => setColors(colors.filter((_, idx) => idx !== i))}>
                    <Text style={styles.colorTagText}>{c} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.addTagRow}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Add color (e.g. White/G)" value={newColor} onChangeText={setNewColor} />
                <TouchableOpacity style={styles.addTagBtn}
                  onPress={() => { if (newColor.trim()) { setColors([...colors, newColor.trim()]); setNewColor(''); } }}>
                  <Text style={styles.addTagBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { marginTop: 12 }]}>Sizes</Text>
              <View style={styles.predefinedSizes}>
                {['S', 'M', 'L', 'XL', 'XXL', '50', '52', '54', '56', '58', '60'].map(s => (
                  <TouchableOpacity key={s}
                    style={[styles.preSize, sizes.includes(s) && styles.preSizeActive]}
                    onPress={() => {
                      if (sizes.includes(s)) setSizes(sizes.filter(x => x !== s));
                      else setSizes([...sizes, s]);
                    }}>
                    <Text style={[styles.preSizeText, sizes.includes(s) && styles.preSizeTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.addTagRow}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Custom size" value={newSize} onChangeText={setNewSize} />
                <TouchableOpacity style={styles.addTagBtn}
                  onPress={() => { if (newSize.trim()) { setSizes([...sizes, newSize.trim()]); setNewSize(''); } }}>
                  <Text style={styles.addTagBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>
              {sizes.length > 0 && (
                <View style={[styles.tagsRow, { marginTop: 8 }]}>
                  {sizes.map((s, i) => (
                    <TouchableOpacity key={i} style={styles.sizeTag}
                      onPress={() => setSizes(sizes.filter((_, idx) => idx !== i))}>
                      <Text style={styles.sizeTagText}>{s} ✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>💡 After saving, open Costing Sheet to set the selling price.</Text>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setEditingItem(null); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveItem}>
                <Text style={styles.saveText}>{editingItem ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* COSTING SHEET MODAL */}
      <Modal visible={costingModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDesktop && styles.modalDesktop]}>
            <Text style={styles.modalTitle}>📊 Costing Sheet — {costingItem?.style_no}</Text>
            <Text style={styles.modalSub}>{costingItem?.description} · {costingItem?.party_name}</Text>
            <ScrollView>
              <View style={styles.costingTable}>
                <View style={styles.costingTableHeader}>
                  <Text style={[styles.costingTh, { flex: 2 }]}>Cost Item</Text>
                  <Text style={[styles.costingTh, { flex: 1, textAlign: 'right' }]}>Amount (PKR)</Text>
                  <Text style={[styles.costingTh, { width: 30 }]}></Text>
                </View>
                {costingSheet.map((item) => (
                  <View key={item.id} style={styles.costingRow}>
                    <TextInput style={[styles.costingLabelInput, { flex: 2 }]}
                      value={item.label} onChangeText={(v) => updateCostItem(item.id, 'label', v)}
                      placeholder="Cost item name" />
                    <TextInput style={[styles.costingAmountInput, { flex: 1 }]}
                      value={String(item.amount)} onChangeText={(v) => updateCostItem(item.id, 'amount', v)}
                      keyboardType="numeric" placeholder="0" />
                    <TouchableOpacity style={{ width: 30, alignItems: 'center' }} onPress={() => removeCostItem(item.id)}>
                      <Text style={{ color: '#ef4444', fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.addTagRow}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Add custom cost item (e.g. Embroidery)"
                  value={newCostLabel} onChangeText={setNewCostLabel} />
                <TouchableOpacity style={styles.addTagBtn} onPress={addCustomCostItem}>
                  <Text style={styles.addTagBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.costingSummary}>
                <View style={styles.costingSummaryRow}>
                  <Text style={styles.costingSummaryLabel}>Total Cost</Text>
                  <Text style={styles.costingSummaryValue}>PKR {totalCost.toLocaleString()}</Text>
                </View>
                <View style={[styles.costingSummaryRow, { marginTop: 10 }]}>
                  <Text style={styles.costingSummaryLabel}>Profit Margin (PKR)</Text>
                  <View style={styles.profitInputRow}>
                    <Text style={styles.pKRLabel}>PKR</Text>
                    <TextInput style={styles.profitInput}
                      value={String(profitMargin)} onChangeText={setProfitMargin}
                      keyboardType="numeric" placeholder="0" />
                  </View>
                </View>
                {totalCost > 0 && parseFloat(profitMargin || 0) > 0 && (
                  <Text style={styles.marginPercent}>
                    {((parseFloat(profitMargin || 0) / totalCost) * 100).toFixed(1)}% profit margin
                  </Text>
                )}
              </View>
              <View style={styles.sellingPriceBox}>
                <View>
                  <Text style={styles.sellingPriceLabel}>SELLING PRICE</Text>
                  <Text style={styles.sellingPriceSub}>PKR {totalCost.toLocaleString()} cost + PKR {parseInt(profitMargin || 0).toLocaleString()} margin</Text>
                </View>
                <Text style={styles.sellingPriceValue}>PKR {sellingPrice.toLocaleString()}</Text>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCostingModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#16a34a', flex: 0.6 }]} onPress={printCostingSheet}>
                <Text style={styles.saveText}>🖨️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveCostingSheet}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
                      {/* IMAGE PREVIEW MODAL */}
      <Modal visible={!!previewImage} animationType="fade" transparent>
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setPreviewImage(null)}>
          {previewImage && (
            <img
              src={previewImage}
              style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: 8 }}
            />
          )}
          <Text style={{ color: '#fff', marginTop: 16, fontSize: 13 }}>Tap anywhere to close</Text>
        </TouchableOpacity>
      </Modal>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  addBtn: { backgroundColor: '#4361ee', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  searchInput: { backgroundColor: '#fff', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  empty: { textAlign: 'center', color: '#888', padding: 40 },
  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2 },
  itemCardTop: { flexDirection: 'row', marginBottom: 12 },
  itemCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' },
  styleNo: { fontSize: 17, fontWeight: '700', color: '#1e1b4b' },
  priceBadge: { backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  priceBadgeText: { fontSize: 12, fontWeight: '600', color: '#065f46' },
  noPriceBadge: { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  noPriceBadgeText: { fontSize: 12, fontWeight: '600', color: '#92400e' },
  itemDesc: { fontSize: 13, color: '#666', marginBottom: 2 },
  itemParty: { fontSize: 12, color: '#4361ee', marginBottom: 2 },
  itemFabric: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  imagePlaceholder: { width: 70, height: 70, backgroundColor: '#f3f4f6', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  imagePlaceholderText: { fontSize: 28 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  colorTag: { backgroundColor: '#eef2ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  colorTagText: { fontSize: 11, color: '#4361ee', fontWeight: '500' },
  sizeTag: { backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sizeTagText: { fontSize: 11, color: '#374151', fontWeight: '500' },
  costingInfo: { alignItems: 'flex-end', gap: 2, paddingLeft: 12 },
  costingLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  costingValue: { fontSize: 13, fontWeight: '600', color: '#1e1b4b' },
  itemCardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  costingBtn: { backgroundColor: '#eef2ff', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14, borderWidth: 1, borderColor: '#c7d2fe' },
  costingBtnText: { color: '#4361ee', fontWeight: '600', fontSize: 13 },
  editBtn: { backgroundColor: '#fef3c7', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  editBtnText: { color: '#92400e', fontWeight: '600', fontSize: 13 },
  delBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  delBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
  label: { fontSize: 13, color: '#444', marginBottom: 6, marginTop: 4 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  catBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  catBtnText: { fontSize: 13, color: '#444' },
  catBtnTextActive: { color: '#fff' },
  addTagRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  addTagBtn: { backgroundColor: '#4361ee', borderRadius: 8, paddingVertical: 11, paddingHorizontal: 14 },
  addTagBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  predefinedSizes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  preSize: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  preSizeActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  preSizeText: { fontSize: 13, color: '#444', fontWeight: '500' },
  preSizeTextActive: { color: '#fff' },
  noteBox: { backgroundColor: '#fef3c7', borderRadius: 8, padding: 12, marginTop: 8 },
  noteText: { fontSize: 13, color: '#92400e' },
  uploadBox: { borderWidth: 2, borderColor: '#c7d2fe', borderStyle: 'dashed', borderRadius: 8, padding: 24, alignItems: 'center', marginBottom: 10, position: 'relative', backgroundColor: '#f8faff' },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { fontSize: 13, color: '#6366f1' },
  removeImgBtn: { backgroundColor: '#fee2e2', borderRadius: 6, padding: 8, alignItems: 'center', marginTop: 6 },
  removeImgText: { color: '#ef4444', fontSize: 13, fontWeight: '500' },
  costingTable: { backgroundColor: '#f8faff', borderRadius: 10, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#e0e7ff' },
  costingTableHeader: { flexDirection: 'row', backgroundColor: '#1e1b4b', paddingVertical: 10, paddingHorizontal: 12 },
  costingTh: { color: '#fff', fontWeight: '600', fontSize: 12 },
  costingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 8 },
  costingLabelInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, padding: 8, fontSize: 13, backgroundColor: '#fff' },
  costingAmountInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, padding: 8, fontSize: 13, backgroundColor: '#fff', textAlign: 'right' },
  costingSummary: { backgroundColor: '#f8faff', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e0e7ff' },
  costingSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  costingSummaryLabel: { fontSize: 14, color: '#444', fontWeight: '500' },
  costingSummaryValue: { fontSize: 16, fontWeight: '700', color: '#1e1b4b' },
  profitInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pKRLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  profitInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, fontSize: 14, width: 120, textAlign: 'right', backgroundColor: '#fff' },
  marginPercent: { fontSize: 12, color: '#16a34a', fontWeight: '600', textAlign: 'right', marginTop: 6 },
  sellingPriceBox: { backgroundColor: '#1e1b4b', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sellingPriceLabel: { fontSize: 13, color: '#a5b4fc', fontWeight: '600', letterSpacing: 1 },
  sellingPriceSub: { fontSize: 11, color: '#6366f1', marginTop: 3 },
  sellingPriceValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '95%', width: '100%' },
  modalDesktop: { borderRadius: 16, width: 560, marginBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: '#1e1b4b' },
  modalSub: { fontSize: 13, color: '#666', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 11, fontSize: 14, marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '500' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#4361ee', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' }
});