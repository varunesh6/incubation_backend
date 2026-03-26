const fs = require('fs');

const file = 'f:/startup/frontend/src/pages/dashboards/DeveloperDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '                {/* My Active Projects (Startups) Section */}';
const endStr = '                {/* Modals */}';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx === -1 || endIdx === -1) {
    console.log("Could not find start or end bounds!");
    process.exit(1);
}

const replacement = `                {/* My Active Projects (Tasks) Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
                    <Code size={20} color="#2563eb" /> My Active Tasks ({tasks.length})
                </div>

                <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: tasks.length === 0 ? '4rem 2rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '2.5rem' }}>
                    {tasks.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                                <Code size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: 0, marginBottom: '0.5rem' }}>No active tasks yet</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Browse available startups below to apply!</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div key={task.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>{task.title}</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Startup: <strong>{task.startup_title}</strong></p>
                                    </div>
                                    <span className={\`badge-\${task.status.toLowerCase().replace(' ', '-')}-light\`} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px' }}>
                                        {task.status}
                                    </span>
                                </div>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#334155', lineHeight: '1.5' }}>{task.description}</p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.85rem' }}>
                                            <Calendar size={14} /> Deadline: {new Date(task.deadline).toLocaleDateString()}
                                            {task.status !== 'Completed' && task.status !== 'Submitted' && (
                                                <span style={{ margin: '0 0.5rem', color: '#cbd5e1' }}>|</span>
                                            )}
                                            {task.status !== 'Completed' && task.status !== 'Submitted' && (
                                                <CountdownTimer deadline={task.deadline} />
                                            )}
                                        </div>
                                        {task.extension_requested && (
                                            <span style={{ fontSize: '0.75rem', color: '#f59e0b', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px' }}>
                                                Extension Requested
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => {
                                                const projectTasks = tasks.filter(t => t.startup_id === task.startup_id);
                                                setSelectedProjectHistory({
                                                    startup_title: task.startup_title,
                                                    developer_name: task.developer_name,
                                                    tasks: projectTasks.length > 0 ? projectTasks : [task]
                                                });
                                                setProjectHistoryModalOpen(true);
                                            }}
                                            className="btn-secondary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
                                        >
                                            <Briefcase size={14} /> View Review History
                                        </button>

                                        {!viewingDeveloperId && task.status !== 'Completed' && task.status !== 'Submitted' && task.startup_status !== 'Completed' && (
                                            <>
                                                <button onClick={() => openSubmitModal(task)} className="btn-success" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderRadius: '6px' }}>
                                                    <CheckCircle size={14} /> Submit Progress
                                                </button>
                                                {!task.extension_requested && (
                                                    <button onClick={() => openExtensionModal(task)} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                                        Request Extension
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {
                                    task.feedback && (
                                        <div style={{ marginTop: '0.5rem', padding: '1rem', background: task.status === 'Changes Requested' ? '#fef2f2' : '#f0fdf4', borderLeft: \`3px solid \${task.status === 'Changes Requested' ? '#ef4444' : '#10b981'}\`, borderRadius: '4px' }}>
                                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: task.status === 'Changes Requested' ? '#b91c1c' : '#047857', marginBottom: '0.25rem' }}>Mentor Feedback:</p>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{task.feedback}</p>
                                        </div>
                                    )
                                }
                            </div>
                        ))
                    )}
                </div>
            </div>

`;

content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
fs.writeFileSync(file, content, 'utf8');
console.log('Replaced successfully');
