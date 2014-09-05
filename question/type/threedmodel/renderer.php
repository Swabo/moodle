<?php

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * threedmodel 'question' renderer class.
 *
 * @package    qtype
 * @subpackage threedmodel
 * @copyright  2009 The Open University
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

/**
 * Generates the output for threedmodel 'question's.
 *
 * @copyright  2009 The Open University
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class qtype_threedmodel_renderer extends qtype_renderer {

    public function formulation_and_controls(question_attempt $qa, question_display_options $options) {
        global $PAGE;
        global $CFG;
        $model_file_urls = self::get_model_urls($qa, 'threedmodel');

      //  $PAGE->requires->css('/question/type/threedmodel/threedmodel_styles.css');
        $PAGE->requires->js(new moodle_url($CFG->wwwroot . '/question/type/threedmodel/lib/three.min.js'));
        $PAGE->requires->js(new moodle_url($CFG->wwwroot . '/question/type/threedmodel/lib/ColladaLoader.js'));
        $PAGE->requires->js(new moodle_url($CFG->wwwroot . '/question/type/threedmodel/lib/OrbitControls.js'));
        $PAGE->requires->js(new moodle_url($CFG->wwwroot . '/question/type/threedmodel/lib/TransformControls.js'));
        $PAGE->requires->js(new moodle_url($CFG->wwwroot . '/question/type/threedmodel/lib/dat.gui.js'));

//        $PAGE->requires->js_init_call('M.qtype_threedmodel.dddm.init', $model_file_urls);
        $PAGE->requires->yui_module('moodle-qtype_threedmodel-threedmodel', 'M.qtype_threedmodel.threedmodel.init', array($model_file_urls));

        //      return '<div>'.''.'</div>';
        return html_writer::tag('div', '', array('id' => 'threedmodelContainer'));
    }

    public function formulation_heading() {
        return get_string('informationtext', 'qtype_threedmodel');
    }

    protected static function get_model_urls(question_attempt $qa, $filearea, $itemid = 0) {
        $question = $qa->get_question();
        $qubaid = $qa->get_usage_id();
        $slot = $qa->get_slot();
        $fs = get_file_storage();
        if ($filearea == 'threedmodel') {
            $itemid = $question->id;
        }
        $componentname = $question->qtype->plugin_name();
        $draftfiles = $fs->get_area_files($question->contextid, $componentname, $filearea, $itemid, 'sortorder DESC');
        if ($draftfiles) {
            foreach ($draftfiles as $file) {
                if ($file->is_directory()) {
                    continue;
                }
                $baseurl = moodle_url::make_pluginfile_url($question->contextid, $componentname, $filearea, "$qubaid/$slot/{$itemid}", '/', '');
                // $fullurl = moodle_url::make_pluginfile_url($question->contextid, $componentname, $filearea, "$qubaid/$slot/{$itemid}", '/', $file->get_filename());
                return array('model_base_url' => $baseurl->out(), 'model_file_name' => $file->get_filename());
            }
        }
        return null;
    }

}
