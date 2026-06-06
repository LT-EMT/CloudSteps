import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from 'antd'
import AdminLayout from '@/components/Layout/AdminLayout'
import { get, post, put, del } from '@/utils/request'
import { getApiBaseURL } from '@/config/apiConfig'
import { showAlert } from '@/utils/notification'
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Upload, X, Library, RefreshCw } from 'lucide-react'

const { TextArea } = Input

interface WordBook {
  id: number
  name: string
  description: string
  level: string
  wordCount: number
  coverUrl: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  examTags?: string
  cefrRange?: string
  regionalVariant?: string
  sourceName?: string
  sourceUrl?: string
  licenseNote?: string
}

const LEVELS = ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
]

function coverGradient(name: string) {
  const idx = name.charCodeAt(0) % GRADIENTS.length
  return GRADIENTS[idx]
}

const emptyForm = {
  name: '', description: '', level: '', coverUrl: '', isActive: true, sortOrder: 0,
  examTags: '', cefrRange: '', regionalVariant: '', sourceName: '', sourceUrl: '', licenseNote: '',
}

export default function WordBooks() {
  const navigate = useNavigate()
  const [books, setBooks] = useState<WordBook[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<WordBook | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const pageSize = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await get<any>(`${getApiBaseURL()}/wordbooks/list?page=${page}&pageSize=${pageSize}&keyword=${keyword}`)
      if (res.code === 200) {
        setBooks(res.data.list || [])
        setTotal(res.data.total || 0)
      }
    } finally {
      setLoading(false)
    }
  }, [page, keyword])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setShowModal(true)
  }

  const openEdit = (b: WordBook) => {
    setEditing(b)
    setForm({
      name: b.name, description: b.description, level: b.level, coverUrl: b.coverUrl, isActive: b.isActive, sortOrder: b.sortOrder,
      examTags: b.examTags || '', cefrRange: b.cefrRange || '', regionalVariant: b.regionalVariant || '',
      sourceName: b.sourceName || '', sourceUrl: b.sourceUrl || '', licenseNote: b.licenseNote || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { showAlert('请填写词库名称', 'error'); return }
    setSaving(true)
    try {
      if (editing) {
        await put(`${getApiBaseURL()}/wordbooks/${editing.id}`, form)
        showAlert('更新成功', 'success')
      } else {
        await post(`${getApiBaseURL()}/wordbooks`, form)
        showAlert('创建成功', 'success')
      }
      setShowModal(false)
      load()
    } catch (e: any) {
      showAlert(e?.message || '操作失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (b: WordBook) => {
    if (!confirm(`确定删除词库「${b.name}」？此操作不可恢复。`)) return
    try {
      await del(`${getApiBaseURL()}/wordbooks/${b.id}`)
      showAlert('删除成功', 'success')
      load()
    } catch (e: any) {
      showAlert(e?.message || '删除失败', 'error')
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setCoverUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${getApiBaseURL()}/system/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (data.code === 200) {
        setForm(f => ({ ...f, coverUrl: data.data.url }))
      } else {
        showAlert(data.msg || '上传失败', 'error')
      }
    } catch {
      showAlert('上传失败', 'error')
    } finally {
      setCoverUploading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* 顶部操作栏 */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Input
              value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1) }}
              placeholder="搜索词库名称..."
              prefix={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />} type="primary">
            新建词库
          </Button>
        </div>

        {/* 词库卡片网格 */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">加载中...</div>
        ) : books.length === 0 ? (
          <div className="py-14">
            <div className="max-w-xl mx-auto bg-white/80 dark:bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                <Library className="w-6 h-6 text-teal-700 dark:text-teal-300" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">还没有词库</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">先创建一个词库，然后就可以在里面维护单词与分级内容。</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />} type="primary">
                  创建词库
                </Button>
                <Button
                  onClick={() => load()}
                  icon={<RefreshCw className="w-4 h-4" />}
                  type="default"
                >
                  刷新
                </Button>
                {keyword && (
                  <Button
                    onClick={() => { setKeyword(''); setPage(1) }}
                    icon={<X className="w-4 h-4" />}
                    type="text"
                  >
                    清空搜索
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {books.map(b => (
              <div key={b.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                {/* 封面 */}
                <div
                  className="h-28 flex items-center justify-center cursor-pointer overflow-hidden relative"
                  style={{ background: coverGradient(b.name) }}
                  onClick={() => navigate(`/wordbooks/${b.id}`)}
                >
                  {b.coverUrl ? (
                    <img src={b.coverUrl} alt={b.name} className="w-full h-full object-cover absolute inset-0" />
                  ) : (
                    <>
                      <span className="text-5xl font-bold text-white/20 select-none absolute right-3 bottom-1 leading-none">{b.name.charAt(0)}</span>
                      <span className="text-3xl font-bold text-white drop-shadow z-10">{b.name.charAt(0).toUpperCase()}</span>
                    </>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-semibold text-slate-800 dark:text-slate-100 truncate cursor-pointer hover:text-teal-700"
                        onClick={() => navigate(`/wordbooks/${b.id}`)}
                      >
                        {b.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{b.description || '暂无描述'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {b.level && <span className="px-2 py-0.5 text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-200 rounded-full">{b.level}</span>}
                    <span className="text-xs text-slate-500">{b.wordCount} 词</span>
                    {!b.isActive && <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-full">已下架</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <Button
                      onClick={() => navigate(`/wordbooks/${b.id}`)}
                      size="small"
                      type="default"
                      className="flex-1"
                    >
                      管理单词
                    </Button>
                    <Button onClick={() => openEdit(b)} size="small" type="text" icon={<Pencil className="w-3.5 h-3.5" />} />
                    <Button onClick={() => handleDelete(b)} size="small" type="text" danger icon={<Trash2 className="w-3.5 h-3.5" />} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button disabled={page <= 1} onClick={() => setPage(p => p - 1)} icon={<ChevronLeft className="w-4 h-4" />} />
            <span className="text-sm text-slate-600 dark:text-slate-400">{page} / {totalPages}</span>
            <Button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} icon={<ChevronRight className="w-4 h-4" />} />
          </div>
        )}
      </div>

      {/* 新建/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{editing ? '编辑词库' : '新建词库'}</h2>
              <Button type="text" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</Button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">词库名称 *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">描述</label>
                <TextArea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">等级</label>
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {LEVELS.map(l => <option key={l} value={l}>{l || '不限'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">排序权重</label>
                  <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">封面图</label>
                <div className="flex items-center gap-3">
                  {form.coverUrl ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 flex-shrink-0">
                      <img src={form.coverUrl} alt="封面" className="w-full h-full object-cover" />
                      <Button
                        type="text"
                        size="small"
                        onClick={() => setForm(f => ({ ...f, coverUrl: '' }))}
                        className="absolute top-0.5 right-0.5 w-5 h-5 min-w-0 p-0 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                        icon={<X className="w-3 h-3" />}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center flex-shrink-0 text-slate-400">
                      <Upload className="w-5 h-5" />
                    </div>
                  )}
                  <Button
                    type="default"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUploading}
                    size="small"
                  >
                    {coverUploading ? '上传中...' : '选择图片'}
                  </Button>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">上架（用户可见）</label>
              </div>

              <details className="rounded-lg border border-slate-200 dark:border-slate-600 p-3">
                <summary className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">词库元数据（考试 / CEFR / 来源）</summary>
                <div className="mt-4 space-y-3 pt-1">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">考试标签（JSON 数组，如 [&quot;CET-4&quot;,&quot;考研&quot;]）</label>
                    <TextArea value={form.examTags} onChange={e => setForm(f => ({ ...f, examTags: e.target.value }))} rows={2} className="font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">CEFR 区间</label>
                      <Input value={form.cefrRange} onChange={e => setForm(f => ({ ...f, cefrRange: e.target.value }))} placeholder="如 A2-B1" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">变体</label>
                      <Input value={form.regionalVariant} onChange={e => setForm(f => ({ ...f, regionalVariant: e.target.value }))} placeholder="en-US / en-GB" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">数据来源名称</label>
                    <Input value={form.sourceName} onChange={e => setForm(f => ({ ...f, sourceName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">来源链接</label>
                    <Input value={form.sourceUrl} onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">授权 / 版权说明</label>
                    <TextArea value={form.licenseNote} onChange={e => setForm(f => ({ ...f, licenseNote: e.target.value }))} rows={2} />
                  </div>
                </div>
              </details>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <Button onClick={() => setShowModal(false)}>取消</Button>
              <Button onClick={handleSave} disabled={saving} type="primary">
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
