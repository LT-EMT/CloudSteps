import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import AdminLayout from '@/components/Layout/AdminLayout'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Badge from '@/components/UI/Badge'
import EmptyState from '@/components/UI/EmptyState'
import Modal from '@/components/UI/Modal'
import ConfirmDialog from '@/components/UI/ConfirmDialog'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/UI/Select'
import { Switch } from '@/components/UI/Switch'
import { showAlert } from '@/utils/notification'

interface Scenario {
  id: number
  slug: string
  name: string
  description: string
  icon: string
  difficulty: string
  aiRole: string
  prompt: string
  enabled: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '入门' },
  { value: 'medium', label: '进阶' },
  { value: 'hard', label: '挑战' },
]

const ScenarioDialogues = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null)
  const [deletingScenario, setDeletingScenario] = useState<Scenario | null>(null)
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    icon: '',
    difficulty: 'medium',
    aiRole: '',
    prompt: '',
    enabled: true,
    sortOrder: 0,
  })

  const fetchScenarios = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/admin/scenarios', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (data.code === 200) {
        setScenarios(data.data || [])
      } else {
        showAlert(data.msg || '获取场景列表失败', 'error')
      }
    } catch (error) {
      showAlert('获取场景列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScenarios()
  }, [])

  const handleCreate = () => {
    setEditingScenario(null)
    setFormData({
      slug: '',
      name: '',
      description: '',
      icon: '',
      difficulty: 'medium',
      aiRole: '',
      prompt: '',
      enabled: true,
      sortOrder: 0,
    })
    setModalOpen(true)
  }

  const handleEdit = (scenario: Scenario) => {
    setEditingScenario(scenario)
    setFormData({
      slug: scenario.slug,
      name: scenario.name,
      description: scenario.description,
      icon: scenario.icon,
      difficulty: scenario.difficulty,
      aiRole: scenario.aiRole,
      prompt: scenario.prompt,
      enabled: scenario.enabled,
      sortOrder: scenario.sortOrder,
    })
    setModalOpen(true)
  }

  const handleDelete = (scenario: Scenario) => {
    setDeletingScenario(scenario)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingScenario) return
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/admin/scenarios/${deletingScenario.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (data.code === 200) {
        showAlert('删除成功', 'success')
        fetchScenarios()
      } else {
        showAlert(data.msg || '删除失败', 'error')
      }
    } catch (error) {
      showAlert('删除失败', 'error')
    } finally {
      setDeleteDialogOpen(false)
      setDeletingScenario(null)
    }
  }

  const handleToggle = async (scenario: Scenario) => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/admin/scenarios/${scenario.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (data.code === 200) {
        showAlert('更新成功', 'success')
        fetchScenarios()
      } else {
        showAlert(data.msg || '更新失败', 'error')
      }
    } catch (error) {
      showAlert('更新失败', 'error')
    }
  }

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const url = editingScenario
        ? `/api/admin/scenarios/${editingScenario.id}`
        : '/api/admin/scenarios'
      const method = editingScenario ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.code === 200) {
        showAlert(editingScenario ? '更新成功' : '创建成功', 'success')
        setModalOpen(false)
        fetchScenarios()
      } else {
        showAlert(data.msg || '操作失败', 'error')
      }
    } catch (error) {
      showAlert('操作失败', 'error')
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    const config: Record<string, { color: string; label: string }> = {
      easy: { color: 'bg-green-100 text-green-800', label: '入门' },
      medium: { color: 'bg-blue-100 text-blue-800', label: '进阶' },
      hard: { color: 'bg-red-100 text-red-800', label: '挑战' },
    }
    const c = config[difficulty] || { color: 'bg-gray-100 text-gray-800', label: difficulty }
    return <Badge className={c.color}>{c.label}</Badge>
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">场景对话管理</h1>
              <p className="text-sm text-slate-500 mt-1">管理场景对话的场景配置</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchScenarios}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                刷新
              </Button>
              <Button size="sm" onClick={handleCreate}>
                <Plus size={16} />
                新建场景
              </Button>
            </div>
          </div>

          <Card>
            {scenarios.length === 0 && !loading ? (
              <EmptyState
                icon={MessageSquare}
                title="暂无场景"
                description="点击上方按钮创建第一个场景"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">标识</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">名称</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">描述</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">难度</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">排序</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">状态</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((scenario) => (
                      <tr key={scenario.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-600">{scenario.id}</td>
                        <td className="py-3 px-4 text-sm text-slate-800 font-medium">{scenario.slug}</td>
                        <td className="py-3 px-4 text-sm text-slate-800">{scenario.name}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">{scenario.description}</td>
                        <td className="py-3 px-4">{getDifficultyBadge(scenario.difficulty)}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{scenario.sortOrder}</td>
                        <td className="py-3 px-4">
                          <Switch
                            checked={scenario.enabled}
                            onCheckedChange={() => handleToggle(scenario)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(scenario)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(scenario)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingScenario ? '编辑场景' : '新建场景'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">标识 *</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="例如: restaurant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">名称 *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如: 餐厅点餐"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="场景描述"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">图标</label>
            <Input
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="lucide icon name, 例如: utensils"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">难度</label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">AI 角色</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              value={formData.aiRole}
              onChange={(e) => setFormData({ ...formData, aiRole: e.target.value })}
              placeholder="例如: a friendly restaurant waiter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">对话流程</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="描述对话流程和开场白"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">排序</label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              min={0}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
            <label className="text-sm font-medium text-slate-700">启用</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            保存
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="删除场景"
        message="确定要删除这个场景吗？此操作不可恢复。"
        variant="danger"
      />
    </AdminLayout>
  )
}

export default ScenarioDialogues
