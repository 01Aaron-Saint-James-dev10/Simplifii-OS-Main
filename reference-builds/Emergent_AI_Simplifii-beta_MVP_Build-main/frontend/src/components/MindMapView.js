import React, { useCallback, useMemo } from 'react';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';

const MindMapView = ({ briefData, progress }) => {
  const generateNodesAndEdges = useCallback(() => {
    const nodes = [];
    const edges = [];
    let nodeId = 0;

    nodes.push({
      id: 'root',
      type: 'input',
      data: { label: (<div className="p-3 text-center"><div className="font-bold text-sm text-white">{briefData.assessment_title}</div><div className="text-[10px] text-emerald-300 mt-0.5">{briefData.assessment_type}</div></div>) },
      position: { x: 400, y: 50 },
      style: { background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', borderRadius: '16px', width: 280, boxShadow: '0 4px 20px rgba(16,185,129,0.3)' },
    });

    const weeklyPlan = briefData.output_json?.weeklyPlan || {};
    let yOffset = 200;

    Object.entries(weeklyPlan).forEach(([phase, tasks], phaseIndex) => {
      const phaseNodeId = `phase-${phaseIndex}`;
      const xPosition = 80 + (phaseIndex * 320);

      nodes.push({
        id: phaseNodeId,
        data: { label: (<div className="p-2.5 text-center"><div className="font-semibold text-white text-xs">{phase.replace('OfWeek', ' of Week')}</div><div className="text-[10px] text-zinc-400 mt-0.5">{tasks.length} tasks</div></div>) },
        position: { x: xPosition, y: yOffset },
        style: { background: '#18181B', border: '1px solid #27272A', borderRadius: '12px', width: 200 },
      });

      edges.push({
        id: `e-root-${phaseNodeId}`, source: 'root', target: phaseNodeId, animated: true,
        style: { stroke: '#10B981', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' },
      });

      tasks.forEach((task, taskIndex) => {
        const taskKey = `${phase}_${taskIndex}`;
        const taskNodeId = `task-${nodeId++}`;
        const isCompleted = progress?.[taskKey];

        nodes.push({
          id: taskNodeId,
          data: { label: (<div className="p-2"><div className={`text-[11px] ${isCompleted ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>{task.task.substring(0, 50)}{task.task.length > 50 ? '...' : ''}</div></div>) },
          position: { x: xPosition - 30, y: yOffset + 100 + (taskIndex * 80) },
          style: { background: isCompleted ? '#052e16' : '#111113', border: isCompleted ? '1px solid #10B981' : '1px solid #27272A', borderRadius: '8px', width: 180 },
        });

        edges.push({
          id: `e-${phaseNodeId}-${taskNodeId}`, source: phaseNodeId, target: taskNodeId,
          style: { stroke: isCompleted ? '#10B981' : '#3F3F46', strokeWidth: 1 },
          markerEnd: { type: MarkerType.ArrowClosed, color: isCompleted ? '#10B981' : '#3F3F46' },
        });
      });
    });

    return { nodes, edges };
  }, [briefData, progress]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => generateNodesAndEdges(), [generateNodesAndEdges]);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[600px] bg-[#0D0D0F] rounded-2xl overflow-hidden border border-white/[0.06]" data-testid="mind-map-view">
      <div className="bg-[#111113] border-b border-white/[0.06] px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /><span className="text-xs text-zinc-500">Done</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-zinc-600 rounded-full" /><span className="text-xs text-zinc-500">Pending</span></div>
      </div>
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView attributionPosition="bottom-right" style={{ background: '#0D0D0F' }}>
        <Controls style={{ backgroundColor: '#18181B', borderRadius: '8px', border: '1px solid #27272A' }} />
        <MiniMap nodeColor={(node) => { if (node.id === 'root') return '#10B981'; return node.style?.background?.includes('052e16') ? '#10B981' : '#27272A'; }} maskColor="rgba(0,0,0,0.3)" style={{ backgroundColor: '#111113', borderRadius: '8px' }} />
        <Background variant="dots" gap={16} size={1} color="#1A1A1C" />
      </ReactFlow>
    </div>
  );
};

export default MindMapView;
